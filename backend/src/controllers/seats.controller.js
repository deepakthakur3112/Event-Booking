import { SeatService } from '../services/seat.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const lockSeat = asyncHandler(async (req, res) => {
  const { eventId, seatId } = req.params;
  const userId = req.user.id;
  
  const result = await SeatService.lockSeat(eventId, seatId, userId);
  sendSuccess(res, result);
});

export const releaseSeat = asyncHandler(async (req, res) => {
  const { eventId, seatId } = req.params;
  const userId = req.user.id;
  
  const result = await SeatService.releaseLock(eventId, seatId, userId);
  sendSuccess(res, result);
});

export const lockMultipleSeats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { seatIds } = req.body;
  const userId = req.user.id;
  
  const result = await SeatService.lockMultipleSeats(eventId, seatIds, userId);
  sendSuccess(res, result);
});

export const getMyLockedSeats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const seats = await SeatService.getLockedSeatsByUser(userId);
  sendSuccess(res, seats);
});

export default {
  lockSeat,
  releaseSeat,
  lockMultipleSeats,
  getMyLockedSeats,
};

