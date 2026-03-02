import { sendError } from '../utils/apiResponse.js';

export const notFound = (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'Validation failed', 400, validationErrors);
  }

  if (err.name === 'CastError') {
    return sendError(res, 'Invalid resource ID', 400);
  }

  return sendError(res, err.message || 'Internal server error', statusCode);
};
