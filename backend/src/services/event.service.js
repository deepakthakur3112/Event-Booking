import { Event, Seat, SEAT_STATUS } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class EventService {
  /**
   * Get all published events
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  static async getEvents(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      city,
      startDate,
      endDate,
      status = 'PUBLISHED'
    } = options;
    
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (city) {
      query['venue.city'] = new RegExp(city, 'i');
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(query),
    ]);

    // Get seat stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const seatStats = await Seat.aggregate([
          { $match: { event: event._id } },
          { 
            $group: {
              _id: null,
              total: { $sum: 1 },
              available: { 
                $sum: { $cond: [{ $eq: ['$status', SEAT_STATUS.AVAILABLE] }, 1, 0] } 
              },
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
            }
          }
        ]);

        const stats = seatStats[0] || { total: 0, available: 0, minPrice: 0, maxPrice: 0 };

        return {
          ...event.toJSON(),
          seatStats: {
            totalSeats: stats.total,
            availableSeats: stats.available,
            priceRange: {
              min: stats.minPrice || 0,
              max: stats.maxPrice || 0,
            },
          },
        };
      })
    );

    return {
      events: eventsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get event by ID with seat statistics
   * @param {string} eventId 
   * @returns {Promise<Object>}
   */
  static async getEventById(eventId) {
    const event = await Event.findById(eventId);
    
    if (!event) {
      throw new NotFoundError('Event');
    }

    // Get detailed seat statistics
    const seatStats = await Seat.aggregate([
      { $match: { event: event._id } },
      { 
        $group: {
          _id: '$sectionType',
          total: { $sum: 1 },
          available: { 
            $sum: { $cond: [{ $eq: ['$status', SEAT_STATUS.AVAILABLE] }, 1, 0] } 
          },
          locked: { 
            $sum: { $cond: [{ $eq: ['$status', SEAT_STATUS.LOCKED] }, 1, 0] } 
          },
          booked: { 
            $sum: { $cond: [{ $eq: ['$status', SEAT_STATUS.BOOKED] }, 1, 0] } 
          },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totals = seatStats.reduce(
      (acc, stat) => ({
        total: acc.total + stat.total,
        available: acc.available + stat.available,
        locked: acc.locked + stat.locked,
        booked: acc.booked + stat.booked,
      }),
      { total: 0, available: 0, locked: 0, booked: 0 }
    );

    return {
      ...event.toJSON(),
      seatStatsBySection: seatStats.map(stat => ({
        sectionType: stat._id,
        total: stat.total,
        available: stat.available,
        locked: stat.locked,
        booked: stat.booked,
        priceRange: { min: stat.minPrice, max: stat.maxPrice },
      })),
      seatStats: {
        ...totals,
        priceRange: {
          min: Math.min(...seatStats.map(s => s.minPrice)),
          max: Math.max(...seatStats.map(s => s.maxPrice)),
        },
      },
    };
  }

  /**
   * Get upcoming events
   * @param {number} limit 
   * @returns {Promise<Object[]>}
   */
  static async getUpcomingEvents(limit = 5) {
    const events = await Event.find({
      isActive: true,
      status: 'PUBLISHED',
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(limit);

    return events;
  }

  /**
   * Get event categories with counts
   * @returns {Promise<Object[]>}
   */
  static async getCategories() {
    const categories = await Event.aggregate([
      { $match: { isActive: true, status: 'PUBLISHED' } },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        }
      },
      { $sort: { count: -1 } }
    ]);

    return categories.map(c => ({
      category: c._id,
      count: c.count,
    }));
  }
}

export default EventService;

