import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventsRoutes from './events.routes.js';
import seatsRoutes from './seats.routes.js';
import bookingsRoutes from './bookings.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/seats', seatsRoutes);
router.use('/bookings', bookingsRoutes);

export default router;

