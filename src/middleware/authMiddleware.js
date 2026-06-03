import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforbugtracker12345!@#');

      // Get user from the token and attach to req
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return sendError(res, 'User matching this token no longer exists', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return sendError(res, 'Not authorized, token validation failed', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }
};
