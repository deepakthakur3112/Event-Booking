import { Router } from 'express';
import { seatsController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateObjectId, validateBody } from '../middlewares/validate.js';

const router = Router();

// All seat operations require authentication
router.use(authenticate);

/**
 * @route   GET /api/seats/my-locked
 * @desc    Get all seats locked by current user
 * @access  Private
 */
router.get('/my-locked', seatsController.getMyLockedSeats);

/**
 * @route   POST /api/seats/events/:eventId/lock
 * @desc    Lock multiple seats for an event
 * @access  Private
 */
router.post(
  '/events/:eventId/lock',
  validateObjectId('eventId'),
  validateBody({
    seatIds: { required: true, type: 'array' },
  }),
  seatsController.lockMultipleSeats
);

/**
 * @route   POST /api/seats/events/:eventId/seats/:seatId/lock
 * @desc    Lock a single seat
 * @access  Private
 */
router.post(
  '/events/:eventId/seats/:seatId/lock',
  validateObjectId('eventId'),
  validateObjectId('seatId'),
  seatsController.lockSeat
);

/**
 * @route   DELETE /api/seats/events/:eventId/seats/:seatId/lock
 * @desc    Release a seat lock
 * @access  Private
 */
router.delete(
  '/events/:eventId/seats/:seatId/lock',
  validateObjectId('eventId'),
  validateObjectId('seatId'),
  seatsController.releaseSeat
);

export default router;

