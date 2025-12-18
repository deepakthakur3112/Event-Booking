import { EventService } from '../services/event.service.js';
import { SeatService } from '../services/seat.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const getEvents = asyncHandler(async (req, res) => {
  const { page, limit, category, city, startDate, endDate } = req.query;
  
  const result = await EventService.getEvents({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    category,
    city,
    startDate,
    endDate,
  });
  
  sendPaginated(res, result.events, result.pagination);
});

export const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await EventService.getEventById(eventId);
  sendSuccess(res, event);
});

export const getEventSeats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const seats = await SeatService.getSeatsByEvent(eventId);
  sendSuccess(res, seats);
});

export const getUpcomingEvents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const events = await EventService.getUpcomingEvents(limit);
  sendSuccess(res, events);
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await EventService.getCategories();
  sendSuccess(res, categories);
});

export default {
  getEvents,
  getEventById,
  getEventSeats,
  getUpcomingEvents,
  getCategories,
};

