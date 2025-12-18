import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against a schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }
      
      if (value !== undefined && value !== null) {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push({ field, message: `${field} must be a string` });
        }
        
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push({ field, message: `${field} must be a number` });
        }
        
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push({ field, message: `${field} must be an array` });
        }
        
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
        }
        
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must not exceed ${rules.maxLength} characters` });
        }
        
        if (rules.min && typeof value === 'number' && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}` });
        }
        
        if (rules.max && typeof value === 'number' && value > rules.max) {
          errors.push({ field, message: `${field} must not exceed ${rules.max}` });
        }
        
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          errors.push({ field, message: rules.patternMessage || `${field} format is invalid` });
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
        }
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      throw new ValidationError(`Invalid ${paramName} format`);
    }
    
    next();
  };
};

/**
 * Validate idempotency key header
 */
export const validateIdempotencyKey = (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  if (!idempotencyKey) {
    throw new ValidationError('X-Idempotency-Key header is required');
  }
  
  if (idempotencyKey.length < 16 || idempotencyKey.length > 64) {
    throw new ValidationError('X-Idempotency-Key must be between 16 and 64 characters');
  }
  
  req.idempotencyKey = idempotencyKey;
  next();
};

export default { validateBody, validateObjectId, validateIdempotencyKey };

