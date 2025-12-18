import { BookingService } from '../services/booking.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const createBooking = asyncHandler(async (req, res) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;
  const idempotencyKey = req.idempotencyKey;
  
  const result = await BookingService.createBooking({
    userId,
    eventId,
    seatIds,
    idempotencyKey,
  });
  
  // Return 200 if duplicate, 201 if new
  if (result.isDuplicate) {
    sendSuccess(res, {
      booking: result.booking,
      message: 'Booking already exists',
    });
  } else {
    sendCreated(res, {
      booking: result.booking,
      message: 'Booking confirmed successfully',
    });
  }
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const userId = req.user.id;
  
  const result = await BookingService.getUserBookings(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
  });
  
  sendPaginated(res, result.bookings, result.pagination);
});

export const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  
  const booking = await BookingService.getBookingById(bookingId, userId);
  sendSuccess(res, booking);
});

export const getBookingByConfirmation = asyncHandler(async (req, res) => {
  const { confirmationNumber } = req.params;
  const userId = req.user.id;
  
  const booking = await BookingService.getBookingByConfirmation(confirmationNumber, userId);
  sendSuccess(res, booking);
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  
  const booking = await BookingService.cancelBooking(bookingId, userId);
  sendSuccess(res, {
    booking,
    message: 'Booking cancelled successfully',
  });
});

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingByConfirmation,
  cancelBooking,
};

