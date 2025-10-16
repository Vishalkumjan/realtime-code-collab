const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey", // Fixed username for SendGrid SMTP
    pass: process.env.SENDGRID_API_KEY, // Put your actual API key here (in .env)
  },
});

// ✅ Verification Email
const sendVerificationEmail = async (email, displayName, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"Realtime Code Collab" <noreply@realtimecodecollab.com>`, // custom name
    to: email,
    subject: "Verify Your Email - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background: white; border-radius: 10px; padding: 30px;">
          <h1 style="color: #0ea5e9; text-align: center;">🚀 Welcome to Realtime Code Collab!</h1>
          <p>Hi ${displayName || "there"},</p>
          <p>Thank you for signing up! Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="padding: 15px 30px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none;">Verify Email</a>
          </div>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}" style="color: #0ea5e9;">${verificationUrl}</a></p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Password Reset Email
const sendPasswordResetEmail = async (email, displayName, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Realtime Code Collab" <noreply@realtimecodecollab.com>`,
    to: email,
    subject: "Reset Your Password - Realtime Code Collab",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background: white; border-radius: 10px; padding: 30px;">
          <h1 style="color: #dc2626; text-align: center;">🔐 Password Reset Request</h1>
          <p>Hi ${displayName || "there"},</p>
          <p>We received a request to reset your password. Click the button below to create a new one.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="padding: 15px 30px; background: #dc2626; color: white; border-radius: 6px; text-decoration: none;">Reset Password</a>
          </div>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a></p>
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
