// server/utils/jwt.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
    displayName: user.displayName || user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
