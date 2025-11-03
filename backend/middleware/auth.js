// Role-Based Access Control (RBAC) Middleware

const passport = require('passport');
const TokenBlacklist = require('../models/TokenBlacklist');

// JWT Authentication middleware
const authenticate = async (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login.' 
      });
    }

    // Check if token is blacklisted
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const blacklistedToken = await TokenBlacklist.findOne({ token });
        if (blacklistedToken) {
          return res.status(401).json({ 
            success: false, 
            message: 'Token has been invalidated. Please login again.' 
          });
        }
      } catch (error) {
        console.error('Blacklist check error:', error);
      }
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permission to access this resource.' 
      });
    }

    next();
  };
};

// Check if user owns the resource or is admin
const authorizeOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Admins can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You can only access your own resources.' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization check failed',
        error: error.message 
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin
};