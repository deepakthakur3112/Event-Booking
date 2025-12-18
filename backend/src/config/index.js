export const config = {
  port: process.env.PORT || 4000,
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/eventplanner',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'eventplanner-super-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  seatLockTTL: parseInt(process.env.SEAT_LOCK_TTL) || 300000, // 5 minutes in ms
  idempotencyTTL: parseInt(process.env.IDEMPOTENCY_TTL) || 86400, // 24 hours in seconds
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

