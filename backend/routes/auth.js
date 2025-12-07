// Authentication Routes with JWT

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const { validatePassword } = require('../utils/passwordValidator');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const emailService = require('../services/emailService');
const { getRoleForEmail } = require('../config/adminConfig');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/),
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('password')
    .custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// @route   POST /auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      // Generic error message to prevent account enumeration
      return res.status(400).json({ 
        success: false, 
        message: 'Registration failed. Please check your information and try again.' 
      });
    }

    const user = await User.create({
      username,
      email,
      passwordHash: password,
      authProvider: 'local',
      role: getRoleForEmail(email) // Dynamic admin role assignment
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.security.verificationToken = verificationToken;
    user.security.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// @route   POST /auth/login
// @desc    Login user and return JWT tokens
// @access  Public
router.post('/login', authLimiter, loginValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error', 
        error: err.message 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid credentials' 
      });
    }

    try {
      // Generate JWT tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken();

      // Set refresh token as HttpOnly cookie
      // Use SameSite=None and secure to allow cross-origin SPA requests (frontend on different port/origin)
      // Browsers require 'secure' when SameSite=None.
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ 
        success: true, 
        message: 'Login successful',
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Token generation failed', 
        error: error.message 
      });
    }
  })(req, res, next);
});

// @route   POST /auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token not found' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.validateRefreshToken(refreshToken)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token' 
      });
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    res.json({ 
      success: true, 
      accessToken 
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token expired. Please login again.' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed', 
      error: error.message 
    });
  }
});

// @route   POST /auth/logout
// @desc    Logout user and invalidate refresh token
// @access  Private
router.post('/logout', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    // Remove refresh token from user
    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    // Add access token to blacklist
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          await TokenBlacklist.create({
            token: accessToken,
            expiresAt: new Date(decoded.exp * 1000) // Convert from seconds to milliseconds
          });
        }
      } catch (tokenError) {
        console.error('Error blacklisting token:', tokenError);
      }
    }

    // Clear cookie with matching attributes to ensure browser removes it
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed', 
      error: error.message 
    });
  }
});

// @route   GET /auth/google
// @desc    Google OAuth initiation
// @access  Public
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth Error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
      }
      if (!user) {
        console.error('Google OAuth - No user returned:', info);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const accessToken = req.user.generateAccessToken();
      const refreshToken = await req.user.generateRefreshToken();

      // Set refresh cookie for OAuth callback similarly to allow SPA to use refresh flow
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

// @route   POST /auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If an account exists, a password reset link has been sent.' 
      });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({ 
        success: false, 
        message: `This account uses ${user.authProvider} authentication` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.security.passwordResetToken = resetToken;
    user.security.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'If an account exists, a password reset link has been sent.' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Request failed', 
      error: error.message 
    });
  }
});

// @route   POST /auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', [
  body('password').custom((value) => {
    const validation = validatePassword(value);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    user.passwordHash = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.failedLoginAttempts = 0;
    user.security.lockedUntil = undefined;
    user.security.refreshTokens = []; // Invalidate all sessions
    await user.save();

    try {
      await emailService.sendPasswordChangedEmail(user.email);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed', 
      error: error.message 
    });
  }
});

module.exports = router;