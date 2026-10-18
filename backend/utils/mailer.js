const nodemailer = require("nodemailer");

// The transporter is built the first time an email is sent, NOT when this file loads.
// server.js loads the routes (and therefore this file) before dotenv has read .env, so reading
// process.env at load time would always find the SMTP settings empty.
let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL, 587 = STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: String(process.env.SMTP_PASS).replace(/\s+/g, ""), // Google shows the App Password in groups of 4
      },
    });
  }
  return transporter;
};

/**
 * Sends a password reset code. Falls back to console logging when SMTP
 * is not configured (dev / demo mode).
 */
exports.sendResetCode = async (to, code) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[NO SMTP CONFIGURED] Password reset code for ${to}: ${code}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@lingobridge.local",
      to,
      subject: "Your LingoBridge password reset code",
      text: `Your password reset code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your LingoBridge password reset code is:</p>
             <h2 style="letter-spacing:4px;">${code}</h2>
             <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
    console.log(`[EMAIL FAILED] Password reset code for ${to}: ${code}`);
  }
};

/**
 * Sends a sign-up / login verification code.
 * Development without SMTP: the code is printed in the backend terminal.
 * Production without working SMTP: throws, so the user is told the code could not be sent.
 */
exports.sendOtpCode = async (to, code, purpose) => {
  const isProd = process.env.NODE_ENV === "production";
  const registering = purpose === "register";
  const subject = registering ? "Verify your LingoBridge email" : "Your LingoBridge login code";
  const intro = registering
    ? "Welcome to LingoBridge! Use this code to verify your email address:"
    : "Use this code to finish logging in to LingoBridge:";

  const transporter = getTransporter();
  if (!transporter) {
    if (isProd) throw new Error("Email is not configured");
    console.log(`[NO SMTP CONFIGURED] ${purpose} code for ${to}: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@lingobridge.local",
      to,
      subject,
      text: `${intro} ${code}. It expires in 10 minutes. If this wasn't you, ignore this email and do not share the code.`,
      html: `<p>${intro}</p>
             <h2 style="letter-spacing:4px;">${code}</h2>
             <p>This code expires in 10 minutes. If this wasn't you, ignore this email and never share the code with anyone.</p>`,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
    if (isProd) throw err;
    console.log(`[EMAIL FAILED] ${purpose} code for ${to}: ${code}`);
  }
};
