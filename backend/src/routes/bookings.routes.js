import { Router } from 'express';
import { bookingsController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateObjectId, validateBody, validateIdempotencyKey } from '../middlewares/validate.js';

const router = Router();

// All booking operations require authentication
router.use(authenticate);

/**
 * @route   GET /api/bookings
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/', bookingsController.getMyBookings);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking (requires idempotency key)
 * @access  Private
 */
router.post(
  '/',
  validateIdempotencyKey,
  validateBody({
    eventId: { required: true, type: 'string' },
    seatIds: { required: true, type: 'array' },
  }),
  bookingsController.createBooking
);

/**
 * @route   GET /api/bookings/confirmation/:confirmationNumber
 * @desc    Get booking by confirmation number
 * @access  Private
 */
router.get(
  '/confirmation/:confirmationNumber',
  bookingsController.getBookingByConfirmation
);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking by ID
 * @access  Private
 */
router.get(
  '/:bookingId',
  validateObjectId('bookingId'),
  bookingsController.getBookingById
);

/**
 * @route   POST /api/bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.post(
  '/:bookingId/cancel',
  validateObjectId('bookingId'),
  bookingsController.cancelBooking
);

export default router;

