const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  validate,
  registerValidation,
  loginValidation,
  resetPasswordValidation,
} = require("../middleware/validate");
const { authLimiter, otpLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Guessing a 6-digit code is capped per code (5 tries) AND per IP.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in a few minutes." },
});
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many code requests. Try again later." },
});

router.post("/register", authLimiter, validate(registerValidation), register);
router.post("/login", authLimiter, validate(loginValidation), login);
router.post("/verify-otp", verifyLimiter, verifyOtp);
router.post("/resend-otp", resendLimiter, resendOtp);
router.get("/me", protect, getMe);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordValidation), resetPassword);
router.post("/logout", protect, logout);

module.exports = router;
