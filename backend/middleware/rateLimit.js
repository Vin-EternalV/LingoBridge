const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// Generic API limiter — protects every route from scraping/flooding.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

// Strict limiter — auth endpoints only. Keyed by IP + email so a shared
// school IP doesn't lock out every learner.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${(req.body?.email || "").toLowerCase()}`,

  message: {
    success: false,
    message: "Too many attempts. Try again in 15 minutes.",
  },

  skipSuccessfulRequests: true,
});

// Tight limiter for actions that send codes/emails.
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) =>
    (req.body?.email || "").toLowerCase() || ipKeyGenerator(req.ip),

  message: {
    success: false,
    message: "Too many reset requests. Try again later.",
  },
});

module.exports = { apiLimiter, authLimiter, otpLimiter };