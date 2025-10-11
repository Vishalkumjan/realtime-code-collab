// backend/server/passport.js - FIX APPLIED (Callback URL)
require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/User");

function setupPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // FIX: Changed /api/oauth/ to /api/auth/
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
          const displayName =
            profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`) || null;
          const avatar = (profile.photos && profile.photos[0] && profile.photos[0].value) || null;
          const user = await User.createFromOAuth({
            provider: "google",
            oauthId: profile.id,
            email,
            displayName,
            avatar,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        // FIX: Changed /api/oauth/ to /api/auth/
        callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3001/api/auth/github/callback",
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
          const displayName = profile.displayName || profile.username || null;
          const avatar = (profile.photos && profile.photos[0] && profile.photos[0].value) || null;
          const user = await User.createFromOAuth({
            provider: "github",
            oauthId: profile.id,
            email,
            displayName,
            avatar,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = setupPassport;