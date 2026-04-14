const jwt = require('jsonwebtoken');

/**
 * protect — JWT authentication middleware
 *
 * Reads the token from the "Authorization: Bearer <token>" header,
 * verifies it with JWT_SECRET, and attaches the decoded payload to req.user.
 * Decoded payload shape: { id, role, email, iat, exp }
 */
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or expired. Please log in again.'
    });
  }
};

/**
 * checkRole — role-based access control middleware
 *
 * Must be used AFTER protect. Checks that req.user.role
 * is included in the list of allowed roles.
 *
 * Usage: router.get('/admin', protect, checkRole('Admin'), handler);
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

// Convenience pre-composed middleware (use after protect)
const isAdmin        = checkRole('Admin');
const isManager      = checkRole('Admin', 'Manager');
const isTechnician   = checkRole('Admin', 'Manager', 'Technician');
const isAuthenticated = checkRole('Admin', 'Manager', 'Technician', 'User');

module.exports = {
  protect,
  checkRole,
  isAdmin,
  isManager,
  isTechnician,
  isAuthenticated
};
