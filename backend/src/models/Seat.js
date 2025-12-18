import mongoose from 'mongoose';

export const SEAT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  BOOKED: 'BOOKED',
  UNAVAILABLE: 'UNAVAILABLE',
};

export const SECTION_TYPES = {
  VIP: 'VIP',
  PREMIUM: 'PREMIUM',
  STANDARD: 'STANDARD',
  ECONOMY: 'ECONOMY',
  STANDING: 'STANDING',
};

const seatSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required'],
    index: true,
  },
  seatNumber: {
    type: String,
    required: [true, 'Seat number is required'],
    trim: true,
  },
  row: {
    type: String,
    required: [true, 'Row is required'],
    trim: true,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
  },
  sectionType: {
    type: String,
    enum: Object.values(SECTION_TYPES),
    required: [true, 'Section type is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  status: {
    type: String,
    enum: Object.values(SEAT_STATUS),
    default: SEAT_STATUS.AVAILABLE,
    index: true,
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lockedAt: {
    type: Date,
    default: null,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  bookedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

// Compound unique index to ensure unique seats per event
seatSchema.index({ event: 1, section: 1, row: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ event: 1, status: 1 });
seatSchema.index({ event: 1, sectionType: 1, status: 1 });

seatSchema.virtual('displayName').get(function() {
  return `${this.section}-${this.row}${this.seatNumber}`;
});

seatSchema.statics.getAvailableSeatsCount = async function(eventId) {
  return this.countDocuments({ 
    event: eventId, 
    status: SEAT_STATUS.AVAILABLE 
  });
};

seatSchema.statics.getSeatsBySection = async function(eventId) {
  return this.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    { 
      $group: {
        _id: { section: '$section', sectionType: '$sectionType' },
        seats: { $push: '$$ROOT' },
        availableCount: {
          $sum: { $cond: [{ $eq: ['$status', SEAT_STATUS.AVAILABLE] }, 1, 0] }
        },
        totalCount: { $sum: 1 },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    },
    { $sort: { '_id.sectionType': 1, '_id.section': 1 } }
  ]);
};

const Seat = mongoose.model('Seat', seatSchema);

export default Seat;

