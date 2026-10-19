const nodemailer = require("nodemailer");

const sendWithBrevo = async ({ to, subject, text, html }) => {
  if (!process.env.BREVO_API_KEY) return false;
  const senderEmail = process.env.BREVO_FROM_EMAIL;
  if (!senderEmail) throw new Error("BREVO_FROM_EMAIL is not configured");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: process.env.BREVO_FROM_NAME || "LingoBridge",
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo API returned ${response.status}: ${details.slice(0, 500)}`);
  }
  return true;
};

const sendWithResend = async ({ to, subject, text, html }) => {
  if (!process.env.RESEND_API_KEY) return false;
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend API returned ${response.status}: ${details.slice(0, 500)}`);
  }
  return true;
};

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
      // SMTP is part of the signup request, so don't let a stalled mail server
      // leave account creation hanging for Nodemailer's much longer defaults.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      dnsTimeout: 10_000,
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
  const message = {
    to,
    subject: "Your LingoBridge password reset code",
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your LingoBridge password reset code is:</p>
             <h2 style="letter-spacing:4px;">${code}</h2>
             <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
  };
  try {
    if (await sendWithBrevo(message)) return;
    if (await sendWithResend(message)) return;
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[NO SMTP CONFIGURED] Password reset code for ${to}: ${code}`);
      return;
    }
    await transporter.sendMail({ from: process.env.SMTP_FROM || "no-reply@lingobridge.local", ...message });
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
    console.log("[EMAIL FAILED] Password reset code delivery failed");
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
  const adminSetup = purpose === "admin_setup";
  const subject = adminSetup ? "Set up your LingoBridge administrator account" : registering ? "Verify your LingoBridge email" : "Your LingoBridge login code";
  const intro = adminSetup
    ? "A LingoBridge administrator invited you. Use this code in the administrator setup screen to verify your email and choose your password:"
    : registering
      ? "Welcome to LingoBridge! Use this code to verify your email address:"
      : "Use this code to finish logging in to LingoBridge:";

  const frontendUrl = String(process.env.FRONTEND_URL || (adminSetup && !isProd ? 'http://localhost:8081' : '')).replace(/\/$/, '');
  if (adminSetup && !frontendUrl) throw new Error('FRONTEND_URL is required to send administrator invitations');
  const setupUrl = adminSetup ? `${frontendUrl}/admin-setup?email=${encodeURIComponent(to)}` : '';
  const textIntro = adminSetup ? `${intro}\n${setupUrl}` : intro;
  const htmlIntro = adminSetup ? `${intro}<br/><a href="${setupUrl}">Open administrator account setup</a>` : intro;

  const message = {
    to,
    subject,
    text: `${textIntro} ${code}. It expires in 10 minutes. If this wasn't you, ignore this email and do not share the code.`,
    html: `<p>${htmlIntro}</p>
             <h2 style="letter-spacing:4px;">${code}</h2>
             <p>This code expires in 10 minutes. If this wasn't you, ignore this email and never share the code with anyone.</p>`,
  };

  try {
    if (await sendWithBrevo(message)) return;
    if (await sendWithResend(message)) return;
    const transporter = getTransporter();
    if (!transporter) {
      if (isProd) throw new Error("Email is not configured");
      console.log(`[NO SMTP CONFIGURED] ${purpose} code for ${to}: ${code}`);
      return;
    }
    await transporter.sendMail({ from: process.env.SMTP_FROM || "no-reply@lingobridge.local", ...message });
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
    // If an API key is configured, treat provider rejection as a real failure
    // in every environment. Never log the OTP when delivery fails.
    if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || isProd) throw err;
    console.log(`[EMAIL FAILED] ${purpose} code delivery failed`);
  }
};
