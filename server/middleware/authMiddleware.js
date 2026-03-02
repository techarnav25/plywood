import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Labour from '../models/Labour.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Not authorized. Token missing.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const userType = decoded.kind === 'labour' ? 'labour' : 'admin';

    if (userType === 'labour') {
      const labour = await Labour.findById(decoded.id).select('-password');

      if (!labour) {
        const error = new Error('Not authorized. User not found.');
        error.statusCode = 401;
        throw error;
      }

      req.user = labour;
      req.user.role = 'labour';
      req.userType = 'labour';
      next();
      return;
    }

    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      const error = new Error('Not authorized. User not found.');
      error.statusCode = 401;
      throw error;
    }

    req.user = admin;
    req.userType = 'admin';
    next();
  } catch (error) {
    error.statusCode = 401;
    throw error;
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('Forbidden. Insufficient permissions.');
      error.statusCode = 403;
      throw error;
    }

    next();
  };
};
