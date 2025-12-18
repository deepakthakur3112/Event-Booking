export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class SeatLockError extends AppError {
  constructor(seatId) {
    super(`Seat ${seatId} is currently locked by another user`, 409, 'SEAT_LOCKED');
    this.seatId = seatId;
  }
}

export class DuplicateBookingError extends AppError {
  constructor(idempotencyKey) {
    super('Duplicate booking request detected', 409, 'DUPLICATE_BOOKING');
    this.idempotencyKey = idempotencyKey;
  }
}

export class SeatUnavailableError extends AppError {
  constructor(seatId, status) {
    super(`Seat ${seatId} is not available (status: ${status})`, 400, 'SEAT_UNAVAILABLE');
    this.seatId = seatId;
    this.currentStatus = status;
  }
}

