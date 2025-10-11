// server/routes/oauth.js - FINAL FIXED CODE FOR OAUTH REDIRECTS

const express = require("express");
const passport = require("passport");
const { signToken } = require("../utils/jwt"); 

const router = express.Router();

// Configuration
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
// Standardized client-side pages for better UX
const LOGIN_PAGE = `${CLIENT_URL}/login`;
const OAUTH_REDIRECT_PAGE = `${CLIENT_URL}/oauth-redirect`; // Client-side component to read the token

/**
 * ---------------------------------------
 * 1. Google OAuth Routes
 * ---------------------------------------
 */

// Google OAuth - Initiate (Start the login flow)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Google OAuth - Callback (Receives data from Google)
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    // FIX 1: Failure hone par user ko /login page par bhejo with clear error status
    failureRedirect: `${LOGIN_PAGE}?oauth_status=failed&provider=google`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = signToken(req.user);

      // FIX 2 (CRITICAL): Redirect to the single, standard client handler page
      // Client side par /oauth-redirect page URL se token padhega.
      res.redirect(`${OAUTH_REDIRECT_PAGE}?token=${token}&status=success`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${LOGIN_PAGE}?oauth_status=error&message=token_generation_failed`);
    }
  }
);

/**
 * ---------------------------------------
 * 2. GitHub OAuth Routes
 * ---------------------------------------
 */

// GitHub OAuth - Initiate
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

// GitHub OAuth - Callback
router.get(
  "/github/callback",
  passport.authenticate("github", { 
    // FIX 1: Failure hone par user ko /login page par bhejo with clear error status
    failureRedirect: `${LOGIN_PAGE}?oauth_status=failed&provider=github`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = signToken(req.user);

      // FIX 2 (CRITICAL): Redirect to the single, standard client handler page
      res.redirect(`${OAUTH_REDIRECT_PAGE}?token=${token}&status=success`);
    } catch (err) {
      console.error("GitHub callback error:", err);
      res.redirect(`${LOGIN_PAGE}?oauth_status=error&message=token_generation_failed`);
    }
  }
);

module.exports = router;