const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const { getRoleForEmail } = require('./adminConfig');

// JWT Strategy (for protected routes)
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use('jwt', new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return done(null, false);
    }

    if (!user.security.isActive) {
      return done(null, false, { message: 'Account is deactivated' });
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Local Strategy
passport.use('local', new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req, email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (user.authProvider !== 'local') {
        return done(null, false, { 
          message: `This account uses ${user.authProvider} authentication` 
        });
      }

      if (user.isLocked()) {
        const lockTimeRemaining = Math.ceil((user.security.lockedUntil - Date.now()) / 60000);
        return done(null, false, { 
          message: `Account locked. Try again in ${lockTimeRemaining} minute(s)` 
        });
      }

      if (!user.security.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        await user.incLoginAttempts();
        return done(null, false, { message: 'Invalid email or password' });
      }

      await user.resetLoginAttempts();
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
passport.use('google', new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        await user.resetLoginAttempts();
        return done(null, user);
      }

      user = await User.findOne({ email: profile.emails[0].value });

      if (user && user.authProvider === 'local') {
        return done(null, false, { 
          message: 'Email already registered with local authentication' 
        });
      }

      user = await User.create({
        email: profile.emails[0].value,
        username: profile.emails[0].value.split('@')[0],
        authProvider: 'google',
        googleId: profile.id,
        role: getRoleForEmail(profile.emails[0].value), // Dynamic admin role assignment
        profile: {
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePicture: profile.photos[0]?.value
        },
        security: {
          isVerified: true,
          isActive: true
        }
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;