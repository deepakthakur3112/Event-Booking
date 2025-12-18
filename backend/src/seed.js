import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

// Connect to database
await mongoose.connect(config.mongoUrl);
logger.info('Connected to MongoDB for seeding');

// Define schemas inline for seed script
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  firstName: String,
  lastName: String,
  phone: String,
  isActive: Boolean,
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  venue: {
    name: String,
    address: String,
    city: String,
    capacity: Number,
  },
  date: Date,
  doorsOpen: Date,
  category: String,
  imageUrl: String,
  status: String,
  isActive: Boolean,
}, { timestamps: true });

const seatSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  seatNumber: String,
  row: String,
  section: String,
  sectionType: String,
  price: Number,
  currency: String,
  status: String,
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lockedAt: Date,
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedAt: Date,
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  idempotencyKey: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  seats: [{
    seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
    seatNumber: String,
    row: String,
    section: String,
    sectionType: String,
    price: Number,
  }],
  totalAmount: Number,
  currency: String,
  status: String,
  customerEmail: String,
  customerName: String,
  confirmationNumber: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
const Seat = mongoose.models.Seat || mongoose.model('Seat', seatSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// Clear existing data
logger.info('Clearing existing data...');
await Promise.all([
  User.deleteMany({}),
  Event.deleteMany({}),
  Seat.deleteMany({}),
  Booking.deleteMany({}),
]);

// Seed Users
logger.info('Seeding users...');
const passwordHash = await bcrypt.hash('password123', 12);

const users = await User.insertMany([
  {
    email: 'john.doe@example.com',
    passwordHash,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0101',
    isActive: true,
  },
  {
    email: 'jane.smith@example.com',
    passwordHash,
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-0102',
    isActive: true,
  },
  {
    email: 'bob.wilson@example.com',
    passwordHash,
    firstName: 'Bob',
    lastName: 'Wilson',
    phone: '+1-555-0103',
    isActive: true,
  },
]);

logger.info(`Created ${users.length} users`);

// Seed Events
logger.info('Seeding events...');
const now = new Date();

const events = await Event.insertMany([
  {
    name: 'Taylor Swift - The Eras Tour',
    description: 'Experience the musical journey through all of Taylor Swift\'s iconic eras. A spectacular 3-hour concert featuring songs from every album.',
    venue: {
      name: 'Madison Square Garden',
      address: '4 Pennsylvania Plaza',
      city: 'New York, NY',
      capacity: 20000,
    },
    date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    doorsOpen: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
    category: 'CONCERT',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    status: 'PUBLISHED',
    isActive: true,
  },
  {
    name: 'NBA Finals Game 7 - Lakers vs Celtics',
    description: 'The ultimate showdown! Watch history unfold as the Lakers face the Celtics in the decisive Game 7 of the NBA Finals.',
    venue: {
      name: 'Crypto.com Arena',
      address: '1111 S Figueroa St',
      city: 'Los Angeles, CA',
      capacity: 19068,
    },
    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    doorsOpen: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
    category: 'SPORTS',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    status: 'PUBLISHED',
    isActive: true,
  },
  {
    name: 'Hamilton - Broadway Musical',
    description: 'The story of America then, told by America now. Lin-Manuel Miranda\'s revolutionary musical about Alexander Hamilton.',
    venue: {
      name: 'Richard Rodgers Theatre',
      address: '226 W 46th St',
      city: 'New York, NY',
      capacity: 1319,
    },
    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    doorsOpen: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
    category: 'THEATER',
    imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800',
    status: 'PUBLISHED',
    isActive: true,
  },
  {
    name: 'Dave Chappelle - Live Comedy Night',
    description: 'An evening of unfiltered comedy with the legendary Dave Chappelle. Expect the unexpected.',
    venue: {
      name: 'The Comedy Store',
      address: '8433 Sunset Blvd',
      city: 'West Hollywood, CA',
      capacity: 450,
    },
    date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    doorsOpen: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 - 1.5 * 60 * 60 * 1000),
    category: 'COMEDY',
    imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
    status: 'PUBLISHED',
    isActive: true,
  },
  {
    name: 'Coachella Valley Music and Arts Festival',
    description: 'The iconic desert music festival featuring world-class artists, art installations, and unforgettable experiences.',
    venue: {
      name: 'Empire Polo Club',
      address: '81-800 Avenue 51',
      city: 'Indio, CA',
      capacity: 125000,
    },
    date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    doorsOpen: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000),
    category: 'FESTIVAL',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    status: 'PUBLISHED',
    isActive: true,
  },
]);

logger.info(`Created ${events.length} events`);

// Seat configurations for different venue types
const seatConfigs = {
  // Large concert venue (Madison Square Garden)
  concert: {
    sections: [
      { name: 'FLOOR-A', type: 'VIP', rows: ['1', '2', '3'], seatsPerRow: 20, basePrice: 450 },
      { name: 'FLOOR-B', type: 'VIP', rows: ['4', '5', '6'], seatsPerRow: 20, basePrice: 350 },
      { name: 'LOWER-101', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 15, basePrice: 250 },
      { name: 'LOWER-102', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 15, basePrice: 250 },
      { name: 'LOWER-103', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 15, basePrice: 250 },
      { name: 'UPPER-201', type: 'STANDARD', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 20, basePrice: 150 },
      { name: 'UPPER-202', type: 'STANDARD', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 20, basePrice: 150 },
      { name: 'UPPER-203', type: 'STANDARD', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 20, basePrice: 150 },
      { name: 'NOSEBLEED-301', type: 'ECONOMY', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 25, basePrice: 75 },
      { name: 'NOSEBLEED-302', type: 'ECONOMY', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 25, basePrice: 75 },
    ],
  },
  // Sports arena
  sports: {
    sections: [
      { name: 'COURTSIDE-A', type: 'VIP', rows: ['1', '2'], seatsPerRow: 12, basePrice: 2500 },
      { name: 'COURTSIDE-B', type: 'VIP', rows: ['1', '2'], seatsPerRow: 12, basePrice: 2000 },
      { name: 'LOWER-100', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 18, basePrice: 800 },
      { name: 'LOWER-101', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 18, basePrice: 750 },
      { name: 'LOWER-102', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 18, basePrice: 700 },
      { name: 'CLUB-200', type: 'STANDARD', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 20, basePrice: 400 },
      { name: 'CLUB-201', type: 'STANDARD', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 20, basePrice: 350 },
      { name: 'UPPER-300', type: 'ECONOMY', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 22, basePrice: 150 },
      { name: 'UPPER-301', type: 'ECONOMY', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 22, basePrice: 125 },
    ],
  },
  // Theater
  theater: {
    sections: [
      { name: 'ORCHESTRA', type: 'VIP', rows: ['AA', 'A', 'B', 'C', 'D', 'E'], seatsPerRow: 25, basePrice: 350 },
      { name: 'FRONT-MEZZ', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 20, basePrice: 275 },
      { name: 'REAR-MEZZ', type: 'STANDARD', rows: ['E', 'F', 'G', 'H'], seatsPerRow: 20, basePrice: 175 },
      { name: 'BALCONY', type: 'ECONOMY', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 18, basePrice: 95 },
    ],
  },
  // Comedy club
  comedy: {
    sections: [
      { name: 'FRONT-ROW', type: 'VIP', rows: ['1', '2'], seatsPerRow: 8, basePrice: 150 },
      { name: 'MAIN-FLOOR', type: 'PREMIUM', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 10, basePrice: 95 },
      { name: 'BACK-SECTION', type: 'STANDARD', rows: ['F', 'G', 'H'], seatsPerRow: 12, basePrice: 65 },
      { name: 'BAR-AREA', type: 'STANDING', rows: ['STANDING'], seatsPerRow: 20, basePrice: 45 },
    ],
  },
  // Festival
  festival: {
    sections: [
      { name: 'VIP-VILLAGE', type: 'VIP', rows: ['VIP'], seatsPerRow: 100, basePrice: 999 },
      { name: 'GA-PLUS', type: 'PREMIUM', rows: ['GA'], seatsPerRow: 500, basePrice: 599 },
      { name: 'GENERAL-ADMISSION', type: 'STANDARD', rows: ['GA'], seatsPerRow: 1000, basePrice: 449 },
    ],
  },
};

// Map events to seat configurations
const eventSeatMapping = [
  { event: events[0], config: seatConfigs.concert },   // Taylor Swift
  { event: events[1], config: seatConfigs.sports },    // NBA Finals
  { event: events[2], config: seatConfigs.theater },   // Hamilton
  { event: events[3], config: seatConfigs.comedy },    // Dave Chappelle
  { event: events[4], config: seatConfigs.festival },  // Coachella
];

// Generate seats for each event
logger.info('Seeding seats...');
let totalSeats = 0;

for (const { event, config } of eventSeatMapping) {
  const seats = [];
  
  for (const section of config.sections) {
    for (const row of section.rows) {
      for (let seatNum = 1; seatNum <= section.seatsPerRow; seatNum++) {
        // Add some price variation based on seat position
        const positionMultiplier = 1 - (seatNum / section.seatsPerRow) * 0.1; // Center seats slightly more expensive
        const price = Math.round(section.basePrice * positionMultiplier);
        
        seats.push({
          event: event._id,
          seatNumber: seatNum.toString(),
          row: row,
          section: section.name,
          sectionType: section.type,
          price: price,
          currency: 'USD',
          status: 'AVAILABLE',
        });
      }
    }
  }
  
  // Insert seats in batches
  const batchSize = 500;
  for (let i = 0; i < seats.length; i += batchSize) {
    const batch = seats.slice(i, i + batchSize);
    await Seat.insertMany(batch);
  }
  
  totalSeats += seats.length;
  logger.info(`Created ${seats.length} seats for "${event.name}"`);
}

logger.info(`Total seats created: ${totalSeats}`);

// Summary
logger.info('');
logger.info('='.repeat(50));
logger.info('SEED DATA SUMMARY');
logger.info('='.repeat(50));
logger.info('');
logger.info('TEST USERS (all passwords are "password123"):');
users.forEach(user => {
  logger.info(`  - ${user.email} (${user.firstName} ${user.lastName})`);
});
logger.info('');
logger.info('EVENTS:');
events.forEach(event => {
  logger.info(`  - ${event.name}`);
  logger.info(`    Venue: ${event.venue.name}, ${event.venue.city}`);
  logger.info(`    Date: ${event.date.toLocaleDateString()}`);
  logger.info('');
});
logger.info('='.repeat(50));
logger.info('Seeding completed successfully!');

await mongoose.disconnect();
process.exit(0);
