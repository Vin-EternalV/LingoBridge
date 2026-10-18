const crypto = require("crypto");
const Otp = require("../models/Otp");
const User = require("../models/User");
const LearningProfile = require("../models/LearningProfile");
const { sendResetCode } = require("../utils/mailer");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const {
  MAX_ATTEMPTS,
  RESEND_SECONDS,
  needsOtp,
  hashCode,
  signChallenge,
  readChallenge,
  maskEmail,
  issueOtp,
} = require("../utils/otp");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  sendSuccess(
    res,
    {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
    "Success",
    statusCode,
  );
};

// Sends a code and tells the app to show the "enter your code" screen.
// No login token is issued here: that only happens after the code is verified.
const startOtpStep = async (user, statusCode, res) => {
  const purpose = user.emailVerified === false ? "register" : "login";
  let resendIn = RESEND_SECONDS;
  try {
    const result = await issueOtp(user, purpose);
    if (result.wait) resendIn = result.wait; // a code was just sent, so keep using it
  } catch (err) {
    console.error("OTP send failed:", err.message);
    return sendError(res, "We couldn't send the verification code. Please try again in a moment.", 502);
  }
  sendSuccess(
    res,
    {
      otpRequired: true,
      challenge: signChallenge(user),
      email: maskEmail(user.email),
      purpose,
      resendIn,
    },
    "Verification code sent",
    statusCode,
  );
};

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({
      email: (email || "").toLowerCase().trim(),
    });

    let user;
    if (existingUser) {
      // Someone who signed up but never entered their code may try again with the same email.
      const neverVerified = existingUser.emailVerified === false && !existingUser.lastLogin;
      if (!neverVerified) {
        return sendError(res, "Email already in use", 400);
      }
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = password;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        firstName,
        lastName,
        email,
        password,
        emailVerified: !needsOtp({ email: (email || "").toLowerCase().trim() }),
      });
      await LearningProfile.create({ userId: user._id });
    }

    // OTP switched off (or a demo account): sign in right away, as before.
    if (!needsOtp(user)) {
      user.emailVerified = true;
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      return sendTokenResponse(user, 201, res);
    }

    await startOtpStep(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Login — with account lockout after 5 failed attempts
// ---------------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +lockedUntil +loginAttempts",
    );

    if (user && !user.isActive && user.suspension?.until && user.suspension.until <= new Date()) {
      user.isActive = true;
      user.suspension = { until: null, reason: '' };
      await user.save({ validateBeforeSave: false });
    }
    if (!user || !user.isActive) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Still locked?
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return sendError(
        res,
        `Account temporarily locked due to repeated failed logins. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
        429,
      );
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        user.loginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });
      return sendError(res, "Invalid credentials", 401);
    }

    // Password is right — clear the failed-attempt counters.
    user.loginAttempts = 0;
    user.lockedUntil = undefined;

    // Accounts that have not completed registration must verify their email.
    // Once registration is verified, password login completes without an OTP.
    if (user.emailVerified === false && needsOtp(user)) {
      await user.save({ validateBeforeSave: false });
      return startOtpStep(user, 200, res);
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Verify the emailed code — finishes both registration and login
// ---------------------------------------------------------------------------
exports.verifyOtp = async (req, res, next) => {
  try {
    const { challenge, code } = req.body;

    const payload = readChallenge(challenge);
    if (!payload) {
      return sendError(res, "Your verification session expired. Please log in again.", 400);
    }
    if (!/^\d{6}$/.test(String(code || ""))) {
      return sendError(res, "Enter the 6-digit code.", 400);
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return sendError(res, "Your verification session expired. Please log in again.", 400);
    }

    // Count this try first (atomically) so parallel guesses can't beat the attempt limit.
    const otp = await Otp.findOneAndUpdate(
      { userId: user._id },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      if (otp) await Otp.deleteOne({ _id: otp._id });
      return sendError(res, "That code has expired. Request a new one.", 400);
    }
    if (otp.attempts > MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: otp._id });
      return sendError(res, "Too many incorrect attempts. Request a new code.", 429);
    }

    const expected = Buffer.from(otp.codeHash, "hex");
    const given = Buffer.from(hashCode(user._id, String(code)), "hex");
    const matches = expected.length === given.length && crypto.timingSafeEqual(expected, given);

    if (!matches) {
      if (otp.attempts >= MAX_ATTEMPTS) {
        await Otp.deleteOne({ _id: otp._id });
        return sendError(res, "Too many incorrect attempts. Request a new code.", 429);
      }
      const left = MAX_ATTEMPTS - otp.attempts;
      return sendError(res, `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.`, 400);
    }

    // Correct: the code can never be used again.
    await Otp.deleteOne({ _id: otp._id });
    user.emailVerified = true;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Send a fresh code (one per minute)
// ---------------------------------------------------------------------------
exports.resendOtp = async (req, res, next) => {
  try {
    const payload = readChallenge(req.body.challenge);
    if (!payload) {
      return sendError(res, "Your verification session expired. Please log in again.", 400);
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return sendError(res, "Your verification session expired. Please log in again.", 400);
    }

    const purpose = user.emailVerified === false ? "register" : "login";
    let result;
    try {
      result = await issueOtp(user, purpose);
    } catch (err) {
      console.error("OTP resend failed:", err.message);
      return sendError(res, "We couldn't send the verification code. Please try again in a moment.", 502);
    }

    if (result.wait) {
      return sendError(res, `Please wait ${result.wait} seconds before asking for another code.`, 429);
    }
    sendSuccess(res, { resendIn: RESEND_SECONDS }, "A new code has been sent");
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Current user + profile
// ---------------------------------------------------------------------------
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await LearningProfile.findOne({ userId: req.user.id });
    sendSuccess(res, { user, profile }, "Current user data");
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Forgot password — issues a 6-digit OTP, hashed, expires in 10 min
// ---------------------------------------------------------------------------
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });

    // Do NOT reveal whether the email exists. Always return the same message.
    if (!user) {
      return sendSuccess(
        res,
        null,
        "If that email is registered, a reset code has been sent.",
      );
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    user.resetPasswordAttempts = 0;
    user.resetPasswordLockedUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // Send the email (or log to console if SMTP isn't configured).
    await sendResetCode(user.email, resetToken);

    sendSuccess(
      res,
      null,
      "If that email is registered, a reset code has been sent.",
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Reset password — verifies the OTP, enforces attempt lockout, updates password
// ---------------------------------------------------------------------------
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (
      typeof token !== "string" ||
      !/^\d{6}$/.test(token) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return sendError(
        res,
        "Enter a valid reset code and a password between 8 and 72 characters.",
        400,
      );
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({ resetPasswordToken }).select(
      "+resetPasswordExpire +resetPasswordAttempts +resetPasswordLockedUntil",
    );

    if (!user) {
      return sendError(res, "Invalid or expired code.", 400);
    }

    if (
      user.resetPasswordLockedUntil &&
      user.resetPasswordLockedUntil > Date.now()
    ) {
      return sendError(
        res,
        "Too many incorrect attempts. Try again later.",
        429,
      );
    }

    if (!user.resetPasswordExpire || user.resetPasswordExpire < Date.now()) {
      // Expired — count this against the user and clear the token.
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      if (user.resetPasswordAttempts >= 5) {
        user.resetPasswordLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, "Invalid or expired code.", 400);
    }

    // Success path
    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordAttempts = 0;
    user.resetPasswordLockedUntil = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Logout — stateless JWT, so just return success
// ---------------------------------------------------------------------------
exports.logout = async (req, res, next) => {
  try {
    sendSuccess(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};
