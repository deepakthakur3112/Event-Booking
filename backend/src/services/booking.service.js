import mongoose from 'mongoose';
import { redis } from '../config/redis.js';
import { Booking, Seat, Event, User, SEAT_STATUS, BOOKING_STATUS } from '../models/index.js';
import { SeatService } from './seat.service.js';
import { config } from '../config/index.js';
import { 
  DuplicateBookingError, 
  NotFoundError,
  ValidationError,
  AuthorizationError,
  SeatUnavailableError
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class BookingService {
  /**
   * Get Redis key for idempotency
   */
  static getIdempotencyKey(key) {
    return `idempotency:booking:${key}`;
  }

  /**
   * Check if idempotency key exists
   * @param {string} idempotencyKey 
   * @returns {Promise<Object|null>}
   */
  static async checkIdempotency(idempotencyKey) {
    // First check Redis (fast path)
    const redisKey = this.getIdempotencyKey(idempotencyKey);
    const cached = await redis.get(redisKey);
    
    if (cached) {
      logger.debug(`Idempotency hit (Redis): ${idempotencyKey}`);
      return JSON.parse(cached);
    }

    // Fall back to database check
    const existingBooking = await Booking.findByIdempotencyKey(idempotencyKey);
    if (existingBooking) {
      logger.debug(`Idempotency hit (DB): ${idempotencyKey}`);
      // Cache it in Redis for future lookups
      await redis.set(
        redisKey, 
        JSON.stringify({ bookingId: existingBooking._id, confirmationNumber: existingBooking.confirmationNumber }),
        'EX', 
        config.idempotencyTTL
      );
      return { bookingId: existingBooking._id, confirmationNumber: existingBooking.confirmationNumber };
    }

    return null;
  }

  /**
   * Store idempotency key in Redis
   */
  static async storeIdempotencyKey(idempotencyKey, bookingId, confirmationNumber) {
    const redisKey = this.getIdempotencyKey(idempotencyKey);
    await redis.set(
      redisKey,
      JSON.stringify({ bookingId, confirmationNumber }),
      'EX',
      config.idempotencyTTL
    );
  }

  /**
   * Create a new booking
   * @param {Object} bookingData 
   * @returns {Promise<Object>}
   */
  static async createBooking({ userId, eventId, seatIds, idempotencyKey }) {
    // Validate inputs
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency key is required');
    }

    if (!seatIds || seatIds.length === 0) {
      throw new ValidationError('At least one seat is required');
    }

    // Check idempotency first
    const existingBooking = await this.checkIdempotency(idempotencyKey);
    if (existingBooking) {
      logger.info(`Duplicate booking request detected: ${idempotencyKey}`);
      // Return the existing booking
      const booking = await Booking.findById(existingBooking.bookingId)
        .populate('event', 'name date venue')
        .populate('user', 'email firstName lastName');
      return {
        booking,
        isDuplicate: true,
      };
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify lock ownership for all seats
    const hasLocks = await SeatService.verifyLockOwnership(eventId, seatIds, userId);
    if (!hasLocks) {
      throw new AuthorizationError('You do not have valid locks on all requested seats');
    }

    try {
      // Fetch and validate seats
      const seats = await Seat.find({ 
        _id: { $in: seatIds }, 
        event: eventId 
      });

      if (seats.length !== seatIds.length) {
        throw new ValidationError('One or more seats not found');
      }

      // Verify all seats are locked by this user
      const invalidSeats = seats.filter(
        seat => seat.status !== SEAT_STATUS.LOCKED || seat.lockedBy?.toString() !== userId
      );

      if (invalidSeats.length > 0) {
        throw new SeatUnavailableError(
          invalidSeats.map(s => s.displayName).join(', '),
          'not locked by you'
        );
      }

      // Calculate total amount
      const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

      // Create booking
      const booking = new Booking({
        idempotencyKey,
        user: userId,
        event: eventId,
        seats: seats.map(seat => ({
          seat: seat._id,
          seatNumber: seat.seatNumber,
          row: seat.row,
          section: seat.section,
          sectionType: seat.sectionType,
          price: seat.price,
        })),
        totalAmount,
        currency: seats[0].currency || 'USD',
        status: BOOKING_STATUS.CONFIRMED,
        customerEmail: user.email,
        customerName: user.fullName,
      });

      await booking.save();

      // Update seats to BOOKED status
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { 
          $set: { 
            status: SEAT_STATUS.BOOKED,
            bookedBy: userId,
            bookedAt: new Date(),
            lockedBy: null,
            lockedAt: null,
          }
        }
      );

      // Clear Redis locks
      for (const seatId of seatIds) {
        const ownerKey = SeatService.getOwnerKey(eventId, seatId);
        await redis.del(ownerKey);
      }

      // Store idempotency key
      await this.storeIdempotencyKey(idempotencyKey, booking._id, booking.confirmationNumber);

      logger.info(`Booking created: ${booking.confirmationNumber} for user ${user.email}`);

      // Return populated booking
      const populatedBooking = await Booking.findById(booking._id)
        .populate('event', 'name date venue')
        .populate('user', 'email firstName lastName');

      return {
        booking: populatedBooking,
        isDuplicate: false,
      };
    } catch (error) {
      // If something fails, try to release the locks
      for (const seatId of seatIds) {
        try {
          const ownerKey = SeatService.getOwnerKey(eventId, seatId);
          await redis.del(ownerKey);
        } catch (e) {
          logger.error(`Failed to release lock for seat ${seatId}: ${e.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Get booking by ID
   * @param {string} bookingId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async getBookingById(bookingId, userId) {
    const booking = await Booking.findById(bookingId)
      .populate('event', 'name date venue category imageUrl')
      .populate('user', 'email firstName lastName');

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Verify ownership
    if (booking.user._id.toString() !== userId) {
      throw new AuthorizationError('You do not have access to this booking');
    }

    return booking;
  }

  /**
   * Get booking by confirmation number
   * @param {string} confirmationNumber 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async getBookingByConfirmation(confirmationNumber, userId) {
    const booking = await Booking.findOne({ confirmationNumber })
      .populate('event', 'name date venue category imageUrl')
      .populate('user', 'email firstName lastName');

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Verify ownership
    if (booking.user._id.toString() !== userId) {
      throw new AuthorizationError('You do not have access to this booking');
    }

    return booking;
  }

  /**
   * Get all bookings for a user
   * @param {string} userId 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  static async getUserBookings(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('event', 'name date venue category imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel a booking
   * @param {string} bookingId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async cancelBooking(bookingId, userId) {
    const booking = await this.getBookingById(bookingId, userId);

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new ValidationError(`Cannot cancel booking with status: ${booking.status}`);
    }

    // Check if event hasn't started yet
    const event = await Event.findById(booking.event);
    if (new Date() >= event.date) {
      throw new ValidationError('Cannot cancel booking after event has started');
    }

    try {
      // Update booking status
      booking.status = BOOKING_STATUS.CANCELLED;
      await booking.save();

      // Release seats back to available
      const seatIds = booking.seats.map(s => s.seat);
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { 
          $set: { 
            status: SEAT_STATUS.AVAILABLE,
            bookedBy: null,
            bookedAt: null,
          }
        }
      );

      logger.info(`Booking cancelled: ${booking.confirmationNumber}`);

      return booking;
    } catch (error) {
      throw error;
    }
  }
}

export default BookingService;
