import { redis, redlock } from '../config/redis.js';
import { Seat, Event, SEAT_STATUS } from '../models/index.js';
import { config } from '../config/index.js';
import { 
  SeatLockError, 
  SeatUnavailableError, 
  NotFoundError,
  ValidationError,
  AuthorizationError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class SeatService {
  /**
   * Get Redis key for seat lock
   */
  static getLockKey(eventId, seatId) {
    return `lock:event:${eventId}:seat:${seatId}`;
  }

  /**
   * Get Redis key for seat owner
   */
  static getOwnerKey(eventId, seatId) {
    return `owner:event:${eventId}:seat:${seatId}`;
  }

  /**
   * Get all seats for an event, grouped by section
   * @param {string} eventId 
   * @returns {Promise<Object>}
   */
  static async getSeatsByEvent(eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    const seats = await Seat.find({ event: eventId })
      .sort({ sectionType: 1, section: 1, row: 1, seatNumber: 1 });

    // Group seats by section
    const sectionMap = new Map();
    
    for (const seat of seats) {
      const sectionKey = seat.section;
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, {
          section: seat.section,
          sectionType: seat.sectionType,
          seats: [],
          stats: {
            total: 0,
            available: 0,
            locked: 0,
            booked: 0,
          },
          priceRange: {
            min: Infinity,
            max: -Infinity,
          },
        });
      }

      const sectionData = sectionMap.get(sectionKey);
      sectionData.seats.push(seat);
      sectionData.stats.total++;
      sectionData.stats[seat.status.toLowerCase()]++;
      sectionData.priceRange.min = Math.min(sectionData.priceRange.min, seat.price);
      sectionData.priceRange.max = Math.max(sectionData.priceRange.max, seat.price);
    }

    // Convert to array and fix price ranges
    const sections = Array.from(sectionMap.values()).map(section => ({
      ...section,
      priceRange: {
        min: section.priceRange.min === Infinity ? 0 : section.priceRange.min,
        max: section.priceRange.max === -Infinity ? 0 : section.priceRange.max,
      },
    }));

    return {
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        venue: event.venue,
      },
      sections,
      summary: {
        totalSeats: seats.length,
        availableSeats: seats.filter(s => s.status === SEAT_STATUS.AVAILABLE).length,
        lockedSeats: seats.filter(s => s.status === SEAT_STATUS.LOCKED).length,
        bookedSeats: seats.filter(s => s.status === SEAT_STATUS.BOOKED).length,
      },
    };
  }

  /**
   * Lock a seat for a user (with Redis distributed lock)
   * @param {string} eventId 
   * @param {string} seatId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async lockSeat(eventId, seatId, userId) {
    const seat = await Seat.findOne({ _id: seatId, event: eventId });
    if (!seat) {
      throw new NotFoundError('Seat');
    }

    // Check if seat is available
    if (seat.status !== SEAT_STATUS.AVAILABLE) {
      // Check if it's locked by the same user
      if (seat.status === SEAT_STATUS.LOCKED && seat.lockedBy?.toString() === userId) {
        // Extend the lock
        return this.extendLock(eventId, seatId, userId);
      }
      throw new SeatUnavailableError(seat.displayName, seat.status);
    }

    const lockKey = this.getLockKey(eventId, seatId);
    const ownerKey = this.getOwnerKey(eventId, seatId);

    try {
      // Acquire distributed lock
      const lock = await redlock.acquire([lockKey], config.seatLockTTL);

      // Update seat status in database
      await Seat.findByIdAndUpdate(seatId, {
        status: SEAT_STATUS.LOCKED,
        lockedBy: userId,
        lockedAt: new Date(),
      });

      // Store owner in Redis for quick lookup
      await redis.set(ownerKey, userId, 'PX', config.seatLockTTL);

      logger.info(`Seat ${seat.displayName} locked by user ${userId}`);

      return {
        seat: await Seat.findById(seatId),
        lock: {
          expiresAt: new Date(Date.now() + config.seatLockTTL),
          ttlMs: config.seatLockTTL,
        },
      };
    } catch (error) {
      if (error.name === 'LockError') {
        throw new SeatLockError(seat.displayName);
      }
      throw error;
    }
  }

  /**
   * Extend an existing lock
   */
  static async extendLock(eventId, seatId, userId) {
    const ownerKey = this.getOwnerKey(eventId, seatId);
    const lockKey = this.getLockKey(eventId, seatId);
    
    const currentOwner = await redis.get(ownerKey);
    if (currentOwner !== userId) {
      throw new AuthorizationError('You do not own this lock');
    }

    // Extend the lock TTL
    await redis.pexpire(ownerKey, config.seatLockTTL);
    
    // Update seat locked time
    await Seat.findByIdAndUpdate(seatId, {
      lockedAt: new Date(),
    });

    const seat = await Seat.findById(seatId);

    logger.info(`Lock extended for seat ${seat.displayName} by user ${userId}`);

    return {
      seat,
      lock: {
        expiresAt: new Date(Date.now() + config.seatLockTTL),
        ttlMs: config.seatLockTTL,
      },
    };
  }

  /**
   * Release a seat lock
   * @param {string} eventId 
   * @param {string} seatId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async releaseLock(eventId, seatId, userId) {
    const seat = await Seat.findOne({ _id: seatId, event: eventId });
    if (!seat) {
      throw new NotFoundError('Seat');
    }

    const ownerKey = this.getOwnerKey(eventId, seatId);
    const currentOwner = await redis.get(ownerKey);

    // Verify ownership
    if (currentOwner && currentOwner !== userId) {
      throw new AuthorizationError('You do not own this lock');
    }

    // Only release if currently locked
    if (seat.status === SEAT_STATUS.LOCKED) {
      await Seat.findByIdAndUpdate(seatId, {
        status: SEAT_STATUS.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
      });

      await redis.del(ownerKey);

      logger.info(`Lock released for seat ${seat.displayName} by user ${userId}`);
    }

    return { success: true };
  }

  /**
   * Lock multiple seats atomically
   * @param {string} eventId 
   * @param {string[]} seatIds 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async lockMultipleSeats(eventId, seatIds, userId) {
    if (!seatIds || seatIds.length === 0) {
      throw new ValidationError('At least one seat ID is required');
    }

    if (seatIds.length > 10) {
      throw new ValidationError('Cannot lock more than 10 seats at once');
    }

    const results = [];
    const lockedSeats = [];
    const errors = [];

    // Try to lock each seat
    for (const seatId of seatIds) {
      try {
        const result = await this.lockSeat(eventId, seatId, userId);
        lockedSeats.push(result.seat);
        results.push({ seatId, success: true, seat: result.seat });
      } catch (error) {
        errors.push({ seatId, error: error.message });
        results.push({ seatId, success: false, error: error.message });
      }
    }

    // If any locks failed, release all acquired locks
    if (errors.length > 0 && lockedSeats.length > 0) {
      for (const seat of lockedSeats) {
        try {
          await this.releaseLock(eventId, seat._id.toString(), userId);
        } catch (err) {
          logger.error(`Failed to release lock during rollback: ${err.message}`);
        }
      }
      throw new ValidationError('Failed to lock all seats', errors);
    }

    return {
      success: errors.length === 0,
      lockedSeats,
      errors,
    };
  }

  /**
   * Check if user owns locks for given seats
   * @param {string} eventId 
   * @param {string[]} seatIds 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  static async verifyLockOwnership(eventId, seatIds, userId) {
    for (const seatId of seatIds) {
      const ownerKey = this.getOwnerKey(eventId, seatId);
      const owner = await redis.get(ownerKey);
      
      if (owner !== userId) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get locked seats for a user
   * @param {string} userId 
   * @returns {Promise<Object[]>}
   */
  static async getLockedSeatsByUser(userId) {
    return Seat.find({ 
      lockedBy: userId, 
      status: SEAT_STATUS.LOCKED 
    }).populate('event', 'name date venue');
  }

  /**
   * Cleanup expired locks (called by a background job)
   */
  static async cleanupExpiredLocks() {
    const expiredLocks = await Seat.find({
      status: SEAT_STATUS.LOCKED,
      lockedAt: { $lt: new Date(Date.now() - config.seatLockTTL) }
    });

    let cleaned = 0;
    for (const seat of expiredLocks) {
      await Seat.findByIdAndUpdate(seat._id, {
        status: SEAT_STATUS.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
      });
      cleaned++;
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired seat locks`);
    }

    return { cleaned };
  }
}

export default SeatService;

