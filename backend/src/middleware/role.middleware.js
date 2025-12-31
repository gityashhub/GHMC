import { ForbiddenError } from '../utils/errors.js';

/**
 * Role Authorization Middleware
 * Verifies if user has required role
 * @param {string[]} allowedRoles Array of allowed roles
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context missing'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};

export default authorize;
