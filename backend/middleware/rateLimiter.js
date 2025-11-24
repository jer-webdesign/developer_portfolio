const rateLimit = require('express-rate-limit');

// If running tests, export no-op limiters so tests are not affected by rate limits
if (process.env.NODE_ENV === 'test') {
  const noop = (req, res, next) => next();
  module.exports = {
    apiLimiter: noop,
    authLimiter: noop,
    registerLimiter: noop,
    passwordResetLimiter: noop
  };
} else {
  // General API rate limiter
  // Relax limits for local development to avoid HMR/dev-client triggering 429s.
  const isDev = process.env.NODE_ENV !== 'production';
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Increase dev limit to tolerate HMR / dev-client traffic; keep production conservative
    max: isDev ? 10000 : 100,
    // Whitelist localhost and common private network ranges (useful when dev server + frontend both run on same machine
    // or when requests are proxied and come from a local LAN address). Also consider X-Forwarded-For header.
    skip: (req, res) => {
      const ip = req.ip || req.connection?.remoteAddress || '';
      const xff = (req.get && req.get('x-forwarded-for')) || req.headers?.['x-forwarded-for'] || '';
      const checkIp = (candidate) => {
        if (!candidate) return false;
        // Normalize and check for common localhost addresses
        if (candidate.includes('::1') || candidate.includes('127.0.0.1') || candidate.includes('::ffff:127.0.0.1')) return true;
        // Private IPv4 ranges: 10.*, 172.16-31.*, 192.168.*
        if (/^(::ffff:)?10\./.test(candidate)) return true;
        if (/^(::ffff:)?192\.168\./.test(candidate)) return true;
        if (/^(::ffff:)?172\.(1[6-9]|2[0-9]|3[0-1])\./.test(candidate)) return true;
        return false;
      };

      if (checkIp(ip)) return true;
      // If X-Forwarded-For is present, it might contain a comma-separated list; test first entry
      if (xff) {
        const first = xff.split(',')[0].trim();
        if (checkIp(first)) return true;
      }
      return false;
    },
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiter for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiter for registration
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      message: 'Too many registration attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiter for password reset
  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      message: 'Too many password reset requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  module.exports = {
    apiLimiter,
    authLimiter,
    registerLimiter,
    passwordResetLimiter
  };
}
// end of file