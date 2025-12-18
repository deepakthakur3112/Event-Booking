import { Router } from 'express';
import { eventsController } from '../controllers/index.js';
import { validateObjectId } from '../middlewares/validate.js';

const router = Router();

/**
 * @route   GET /api/events
 * @desc    Get all published events with pagination
 * @access  Public
 */
router.get('/', eventsController.getEvents);

/**
 * @route   GET /api/events/upcoming
 * @desc    Get upcoming events
 * @access  Public
 */
router.get('/upcoming', eventsController.getUpcomingEvents);

/**
 * @route   GET /api/events/categories
 * @desc    Get event categories with counts
 * @access  Public
 */
router.get('/categories', eventsController.getCategories);

/**
 * @route   GET /api/events/:eventId
 * @desc    Get event by ID with seat statistics
 * @access  Public
 */
router.get('/:eventId', validateObjectId('eventId'), eventsController.getEventById);

/**
 * @route   GET /api/events/:eventId/seats
 * @desc    Get all seats for an event grouped by section
 * @access  Public
 */
router.get('/:eventId/seats', validateObjectId('eventId'), eventsController.getEventSeats);

export default router;

