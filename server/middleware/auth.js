// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

module.exports = async function (req, res, next) {
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        // 1. Check for token
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Missing token" });
        }

        // 2. Verify token and find user
        const payload = jwt.verify(token, JWT_SECRET);
        // Note: Assuming the JWT payload contains { id: user._id }
        const user = await User.findById(payload.id);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        // 3. --- NEW CHECK: Email Verification ---
        // OAuth users are auto-verified in the User Model, so we only block if isEmailVerified is false
        // and they are NOT an OAuth user (meaning they registered locally).
        if (!user.isEmailVerified && !user.oauthProvider) {
            return res.status(403).json({ 
                message: "Forbidden: Please verify your email to access this resource.",
                emailNotVerified: true 
            });
        }
        // ----------------------------------------

        req.user = user;
        next();
    } catch (e) {
        // Handle token expiration, invalid signature, or other JWT errors
        console.error("Auth Middleware Error:", e.message);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};