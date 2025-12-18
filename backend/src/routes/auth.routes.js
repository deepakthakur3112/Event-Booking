import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

// Login validation schema
const loginSchema = {
  email: { 
    required: true, 
    type: 'string',
    pattern: /^\S+@\S+\.\S+$/,
    patternMessage: 'Please enter a valid email address',
  },
  password: { 
    required: true, 
    type: 'string',
    minLength: 1,
  },
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

export default router;

