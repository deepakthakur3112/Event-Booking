import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { config } from '../config/index.js';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  /**
   * Authenticate user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: Object, token: string}>}
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
      .select('+passwordHash');

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
      },
      token,
    };
  }

  /**
   * Generate JWT token for user
   * @param {Object} user 
   * @returns {string}
   */
  static generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Get current user profile
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  static async getProfile(userId) {
    const user = await this.getUserById(userId);
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

export default AuthService;

