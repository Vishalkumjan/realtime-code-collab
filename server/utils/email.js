const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // FIXED: Changed from EMAIL_PASSWORD to EMAIL_PASS
  },
});

// FIX 1: Added 'displayName' argument to match the call in auth.js
const sendVerificationEmail = async (email, displayName, token) => {
  // 🛑 CONFIRMED CORRECT: This uses CLIENT_URL to point to the React frontend (e.g., 5173).
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`; 
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #0ea5e9; text-align: center; margin-bottom: 20px;">🚀 Welcome to Realtime Code Collab!</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${displayName || 'there'}, Thank you for signing up! Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 15px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #0ea5e9; word-break: break-all;">${verificationUrl}</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// FIX 3: Added 'displayName' argument to match the call in auth.js
const sendPasswordResetEmail = async (email, displayName, token) => {
  // 🛑 CONFIRMED CORRECT: This uses CLIENT_URL to point to the React frontend (e.g., 5173).
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`; 
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🔐 Password Reset Request</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
             Hi ${displayName || 'there'}, We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 15px 30px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};