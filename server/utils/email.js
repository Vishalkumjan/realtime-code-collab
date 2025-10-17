const nodemailer = require("nodemailer");

// SendGrid SMTP configuration
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey", // Fixed username for SendGrid SMTP
    pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
  },
});

// ✅ Verification Email
const sendVerificationEmail = async (email, displayName, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"Realtime Code Collab" <${process.env.SENDGRID_FROM_EMAIL}>`, // ✅ Use verified email
    to: email,
    subject: "Verify Your Email - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #0ea5e9; text-align: center; margin-bottom: 20px;">🚀 Welcome to Realtime Code Collab!</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${displayName || "there"},
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for signing up! Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all;">
            <a href="${verificationUrl}" style="color: #0ea5e9;">${verificationUrl}</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);
  } catch (error) {
    console.error("❌ CRITICAL EMAIL SEND ERROR (Verification):", error.message || error);
    throw error; // Re-throw so auth.js can handle it
  }
};

// ✅ Password Reset Email
const sendPasswordResetEmail = async (email, displayName, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Realtime Code Collab" <${process.env.SENDGRID_FROM_EMAIL}>`, // ✅ Use verified email
    to: email,
    subject: "Reset Your Password - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🔐 Password Reset Request</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${displayName || "there"},
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new one.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #dc2626; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all;">
            <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", email);
  } catch (error) {
    console.error("❌ CRITICAL EMAIL SEND ERROR (Reset):", error.message || error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};