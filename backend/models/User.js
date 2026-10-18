const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      match: /^(?:\p{L}\p{M}*)+(?:[ '\u2019-](?:\p{L}\p{M}*)+)*$/u,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      match: /^(?:\p{L}\p{M}*)+(?:[ '\u2019-](?:\p{L}\p{M}*)+)*$/u,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 72,
      validate: {
        validator: value => Buffer.byteLength(value, "utf8") <= 72,
        message: "Password must be 72 UTF-8 bytes or fewer",
      },
      select: false,
    },
    role: {
      type: String,
      enum: ["learner", "admin", "superadmin"],
      default: "learner",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // New sign-ups start unverified and are verified by the emailed code. Accounts created before this
    // field existed (and admin-created accounts) load as verified through the default.
    emailVerified: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    // Used by the AI tutor to add short explanations in the learner's own language.
    nativeLanguage: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    lastLogin: {
      type: Date,
    },
    settings: {
      notifications: {
        dailyReminder: { type: Boolean, default: true },
        reminderTime: {
          type: String,
          default: "18:00",
          match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Reminder time must be HH:MM"],
        },
        weeklyReminder: { type: Boolean, default: true },
      },
      privacy: {
        // When false, AI requests are still counted (for platform stats) but the text is not stored.
        saveAiHistory: { type: Boolean, default: true },
      },
    },
    // Bumped to invalidate every token issued before it (sign out of all devices, password change/reset).
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // ---- Password reset (OTP) ----
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    resetPasswordAttempts: { type: Number, default: 0, select: false },
    resetPasswordLockedUntil: { type: Date, select: false },

    // ---- Login brute-force protection ----
    loginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, tv: this.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );
};

module.exports = mongoose.model("User", userSchema);
