const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with this email (from regular registration)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.oauth_provider = 'google';
          if (profile.photos && profile.photos.length > 0) {
            user.profile_photo = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user from Google profile
        // Generate unique nickname from Google profile
        let nickname = profile.displayName.replace(/\s+/g, '').toLowerCase();

        // Check if nickname exists and make it unique if needed
        let existingUser = await User.findOne({ nickname });
        let counter = 1;
        while (existingUser) {
          nickname = `${profile.displayName.replace(/\s+/g, '').toLowerCase()}${counter}`;
          existingUser = await User.findOne({ nickname });
          counter++;
        }

        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          first_name: profile.name.givenName || profile.displayName.split(' ')[0],
          last_name: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || 'User',
          nickname: nickname,
          profile_photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          oauth_provider: 'google',
          user_type: 'individual'
          // password_hash is not required for OAuth users
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
