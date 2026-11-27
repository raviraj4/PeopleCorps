import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return next(Object.assign(new Error('Authentication required'), { status: 401 }));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).populate('role');
    if (!user || !user.isActive) return next(Object.assign(new Error('Account is unavailable'), { status: 401 }));
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(Object.assign(new Error('Invalid or expired token'), { status: 401 }));
    }
    next(error);
  }
}

export function requirePermission(moduleName, action = 'view') {
  return (req, _res, next) => {
    const permission = req.user?.role?.permissions?.get?.(moduleName) ?? req.user?.role?.permissions?.[moduleName];
    if (!permission?.[action]) return next(Object.assign(new Error('You do not have permission to perform this action'), { status: 403 }));
    next();
  };
}
