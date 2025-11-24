const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters'],
    match: [/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, periods, hyphens, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    // Encrypted storage for sensitive fields (AES-256-GCM)
    bioEncrypted: String,
    profilePicture: String,
    location: String,
    website: String,
    githubUrl: String,
    linkedinUrl: String,
    headline: String, // Hero headline (e.g., "Full Stack Developer")
    subheadlines: [String], // Array of subheadlines for typing effect
    aboutTitle: String,
    aboutContent: String,
    aboutCards: [{
      category: String,
      content: String
    }],
    phone: String, // Contact phone number
    publicEmail: String // Public contact email (can be different from login email)
    ,
    publicEmailEncrypted: String
  },
  skills: [{
    category: {
      type: String,
      required: true
    },
    items: [String]
  }],
  social: {
    github: String,
    linkedin: String,
    twitter: String,
    website: String
  },
  security: {
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    verificationToken: String,
    verificationExpires: Date,
    refreshTokens: [{
      token: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date
    }]
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.security.lockedUntil && this.security.lockedUntil > Date.now());
};

// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $set: {
        'security.failedLoginAttempts': 1,
        'security.lockedUntil': null
      }
    });
  }

  const updates = {
    $inc: { 'security.failedLoginAttempts': 1 }
  };

  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15;

  if (this.security.failedLoginAttempts + 1 >= maxAttempts) {
    updates.$set = {
      'security.lockedUntil': Date.now() + (lockTime * 60 * 1000)
    };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: {
      'security.failedLoginAttempts': 0,
      'security.lockedUntil': null,
      'security.lastLogin': Date.now()
    }
  });
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) {
    return false;
  }
  try {
    return await argon2.verify(this.passwordHash, candidatePassword);
  } catch (error) {
    return false;
  }
};

// Generate JWT access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      userId: this._id,
      username: this.username,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

// Generate JWT refresh token
userSchema.methods.generateRefreshToken = async function() {
  const refreshToken = jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  this.security.refreshTokens.push({
    token: refreshToken,
    expiresAt
  });

  // Keep only last 5 refresh tokens
  if (this.security.refreshTokens.length > 5) {
    this.security.refreshTokens = this.security.refreshTokens.slice(-5);
  }

  await this.save();
  return refreshToken;
};

// Validate refresh token
userSchema.methods.validateRefreshToken = function(token) {
  return this.security.refreshTokens.some(
    rt => rt.token === token && rt.expiresAt > Date.now()
  );
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.security.refreshTokens = this.security.refreshTokens.filter(
    rt => rt.token !== token
  );
  await this.save();
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and store in database
  this.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiry time (default 1 hour)
  const expiryHours = parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS) || 1;
  this.security.passwordResetExpires = Date.now() + (expiryHours * 60 * 60 * 1000);
  
  // Return unhashed token to send via email
  return resetToken;
};

// Verify password reset token
userSchema.methods.verifyPasswordResetToken = function(token) {
  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and hasn't expired
  return (
    this.security.passwordResetToken === hashedToken &&
    this.security.passwordResetExpires > Date.now()
  );
};

// Clear password reset token
userSchema.methods.clearPasswordResetToken = async function() {
  this.security.passwordResetToken = undefined;
  this.security.passwordResetExpires = undefined;
  await this.save();
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function() {
  // Generate random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and store in database
  this.security.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expiry time (default 24 hours)
  this.security.verificationExpires = Date.now() + (24 * 60 * 60 * 1000);
  
  // Return unhashed token to send via email
  return verificationToken;
};

// Verify email verification token
userSchema.methods.verifyEmailToken = function(token) {
  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and hasn't expired
  return (
    this.security.verificationToken === hashedToken &&
    this.security.verificationExpires > Date.now()
  );
};

// Clear verification token and mark as verified
userSchema.methods.markAsVerified = async function() {
  this.security.isVerified = true;
  this.security.verificationToken = undefined;
  this.security.verificationExpires = undefined;
  await this.save();
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // Argon2 configuration from environment variables
    const options = {
      type: argon2.argon2id, // Use Argon2id (recommended)
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536, // 64 MB
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3, // 3 iterations
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1, // 1 thread
    };
    this.passwordHash = await argon2.hash(this.passwordHash, options);
    next();
  } catch (error) {
    next(error);
  }
});

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  if (user.security) {
    delete user.security.passwordResetToken;
    delete user.security.passwordResetExpires;
    delete user.security.verificationToken;
    delete user.security.verificationExpires;
    delete user.security.failedLoginAttempts;
    delete user.security.lockedUntil;
    delete user.security.refreshTokens;
  }
  return user;
};

module.exports = mongoose.model('User', userSchema);