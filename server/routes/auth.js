const express = require("express");
const passport = require("passport");
const crypto = require("crypto");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const authMiddleware = require("../middleware/auth");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

// Configuration
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Rate limiting map (in-memory)
const rateLimitMap = new Map();
const checkRateLimit = (key, maxAttempts = 3, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

/**
 * Local register (with email verification)
 */
router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName } = req.body || {};
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const user = new User({ 
            email: email.toLowerCase(),
            displayName,
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await user.setPassword(password);
        await user.save();

        // Email send logic
        try {
            await sendVerificationEmail(user.email, user.displayName || user.email, verificationToken);
        } catch (emailError) {
            console.error("CRITICAL EMAIL SEND ERROR (Register):", emailError.message || emailError);
        }

        return res.status(201).json({
            message: "Registration successful! Please check your email to verify your account.",
            user: { id: user._id, email: user.email, displayName: user.displayName, isEmailVerified: user.isEmailVerified }
        });
    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * Verify Email (GET request)
 */
/**
 * Verify Email (GET request) - FIXED VERSION
 * Changed from redirect() to JSON response for axios compatibility
 */
/**
 * Verify Email (GET request) - FIXED VERSION
 * Now returns proper status codes and messages
 */
router.get("/verify-email/:token", async (req, res) => {
    try {
        const { token } = req.params;
        console.log("Verifying email with token:", token);

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            // Check if user exists but token is already cleared (already verified)
            const existingUser = await User.findOne({
                emailVerificationToken: null,
                emailVerificationExpires: null
            });

            console.log("Token not found or expired - checking if already verified");
            return res.status(200).json({ 
                message: "This email has already been verified. Please log in with your credentials."
            });
        }

        if (user.isEmailVerified) {
            console.log("User already verified");
            return res.status(200).json({ 
                message: "Email already verified. You can now log in."
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        console.log("Email verified successfully for:", user.email);
        return res.status(200).json({ 
            message: "Email successfully verified! You can now log in."
        });
        
    } catch (err) {
        console.error("verify-email error:", err);
        return res.status(500).json({ 
            message: "Server error during verification"
        });
    }
});


/**
 * Resend Verification Email
 */
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body || {};
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || user.isEmailVerified) {
            // Security measure: Don't reveal if account exists or is verified
            return res.status(200).json({ message: "If an account exists and is not verified, a link has been sent." });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        try {
            await sendVerificationEmail(user.email, user.displayName || user.email, verificationToken);
        } catch (emailError) {
            console.error("CRITICAL EMAIL SEND ERROR (Resend):", emailError.message || emailError);
        }

        return res.status(200).json({ message: "If an account exists and is not verified, a link has been sent." });
    } catch (err) {
        console.error("resend-verification error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * Local login
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Password validation is already using the correct `user.verifyPassword`
        const isPasswordValid = await user.verifyPassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        
        // FIX APPLIED HERE: Uncommented the email verification check to enable client-side resend logic
        if (!user.isEmailVerified && !user.oauthProvider) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in",
                emailNotVerified: user.email // Send the email back for resend functionality
            });
        }

        const token = signToken(user);

        return res.status(200).json({ 
            token,
            user: { 
                id: user._id, 
                email: user.email, 
                displayName: user.displayName, 
                isEmailVerified: user.isEmailVerified 
            }
        });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * Request Password Reset
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const rateLimitKey = `reset:${email.toLowerCase()}`;
        if (!checkRateLimit(rateLimitKey)) {
            return res.status(429).json({ message: "Too many reset requests. Please try again later." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Security measure: Don't reveal if account exists
            return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        try {
            await sendPasswordResetEmail(user.email, user.displayName || user.email, resetToken);
        } catch (emailError) {
            console.error("CRITICAL EMAIL SEND ERROR (Reset):", emailError.message || emailError);
        }

        return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });

    } catch (err) {
        console.error("forgot-password error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * Reset Password
 */
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Client-side par 8-character check hai, server par bhi 8 kar dete hain.
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        await user.setPassword(password);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        const newToken = signToken(user);

        return res.status(200).json({ 
            message: "Password successfully reset!", 
            token: newToken 
        });

    } catch (err) {
        console.error("reset-password error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * Get current user (requires Bearer token)
 */
router.get("/me", authMiddleware, (req, res) => {
    const u = req.user;
    res.json({
        id: u._id,
        email: u.email,
        displayName: u.displayName,
        avatar: u.avatar,
        isEmailVerified: u.isEmailVerified
    });
});


// server/routes/auth.js (Add these routes before module.exports)

/**
 * OAuth Login Routes (Google and GitHub)
 */

// 1. Google Login Start
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. Google Login Callback (Main logic for successful/failed login)
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${CLIENT_URL}/login?oauth_status=failed&message=Google login failed`,
        session: false, // JWT use kar rahe hain, isliye session: false
    }),
    (req, res) => {
        // Successful authentication, generate JWT
        const token = signToken(req.user);
        
        // Redirect back to client with JWT in URL
        res.redirect(`${CLIENT_URL}/oauth-redirect?token=${token}&status=success`);
    }
);

// 3. GitHub Login Start (Agar aap GitHub bhi use kar rahe hain)
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

// 4. GitHub Login Callback
router.get(
    "/github/callback",
    passport.authenticate("github", {
        failureRedirect: `${CLIENT_URL}/login?oauth_status=failed&message=GitHub login failed`,
        session: false,
    }),
    (req, res) => {
        const token = signToken(req.user);
        res.redirect(`${CLIENT_URL}/oauth-redirect?token=${token}&status=success`);
    }
);

// (Existing routes like /me, /login, /register, etc., continue below these)

module.exports = router;

module.exports = router;