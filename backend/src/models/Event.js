import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
    },
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    index: true,
  },
  doorsOpen: {
    type: Date,
  },
  category: {
    type: String,
    enum: ['CONCERT', 'SPORTS', 'THEATER', 'COMEDY', 'FESTIVAL', 'OTHER'],
    default: 'OTHER',
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'SOLD_OUT', 'CANCELLED', 'COMPLETED'],
    default: 'PUBLISHED',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

eventSchema.virtual('seats', {
  ref: 'Seat',
  localField: '_id',
  foreignField: 'event',
});

eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ 'venue.city': 1, date: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;

