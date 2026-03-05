/**
 * Authorization Middleware
 * Provides role-based access control for routes
 */

// Middleware to check if user has required role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // For now, we'll check userId from request body/params
    // In production, you should use JWT tokens or sessions
    const userId = req.body.userId || req.params.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide userId.'
      });
    }

    // In a real app, you'd verify JWT token and extract user info
    // For now, we'll fetch user from database
    const { User } = require('../models');
    
    User.findByPk(userId)
      .then(user => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!user.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated'
          });
        }

        // Check if user's role is in allowedRoles
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
          });
        }

        // Attach user to request object for use in controllers
        req.user = user;
        next();
      })
      .catch(error => {
        console.error('Auth middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Error verifying user authorization',
          error: error.message
        });
      });
  };
};

// Specific role middleware functions
const isAdmin = checkRole('Admin');
const isManager = checkRole('Admin', 'Manager');
const isTechnician = checkRole('Admin', 'Manager', 'Technician');
const isAuthenticated = checkRole('Admin', 'Manager', 'Technician', 'User');

module.exports = {
  checkRole,
  isAdmin,
  isManager,
  isTechnician,
  isAuthenticated
};
