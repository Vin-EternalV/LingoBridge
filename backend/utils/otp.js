const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const { sendOtpCode } = require('./mailer');

const OTP_TTL_MS = 10 * 60 * 1000;        // a code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;     // one new code per minute
const MAX_ATTEMPTS = 5;                   // wrong guesses before the code is thrown away
const CHALLENGE_TTL = '30m';              // how long the "enter your code" step stays open

// Set OTP_ENABLED=false in .env to switch the whole feature off (for example while developing).
const otpEnabled = () => process.env.OTP_ENABLED !== 'false';

// Seeded demo accounts (…@lingobridge.test) can't receive email, so they skip OTP outside production.
const isBypassed = (email) =>
  process.env.NODE_ENV !== 'production' && /@lingobridge\.test$/i.test(email || '');

const needsOtp = (user) => otpEnabled() && !isBypassed(user.email);

const hashCode = (userId, code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${code}`).digest('hex');

// The "challenge" links the password step to the code step. It is signed with a DIFFERENT secret than
// login tokens, so it can never be used to call the API as a logged-in user.
const challengeSecret = () => `${process.env.JWT_SECRET}:otp-challenge`;

const signChallenge = (user) =>
  jwt.sign({ id: String(user._id), kind: 'otp' }, challengeSecret(), { expiresIn: CHALLENGE_TTL });

const readChallenge = (token) => {
  try {
    const payload = jwt.verify(String(token || ''), challengeSecret());
    return payload && payload.kind === 'otp' ? payload : null;
  } catch (e) {
    return null;
  }
};

const maskEmail = (email) => {
  const [name, domain] = String(email).split('@');
  if (!domain) return email;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
};

// Creates (or replaces) the user's code and emails it.
// Returns { sent: true } or { wait: secondsToWait } if a code was sent less than a minute ago.
const issueOtp = async (user, purpose) => {
  const existing = await Otp.findOne({ userId: user._id });
  if (existing) {
    const elapsed = Date.now() - existing.lastSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { wait: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
    }
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await Otp.findOneAndUpdate(
    { userId: user._id },
    {
      purpose,
      codeHash: hashCode(user._id, code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MS)
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpCode(user.email, code, purpose);
  } catch (err) {
    await Otp.deleteOne({ userId: user._id }); // nothing was delivered, so don't keep a useless code
    throw err;
  }
  return { sent: true };
};

module.exports = {
  MAX_ATTEMPTS,
  RESEND_SECONDS: RESEND_COOLDOWN_MS / 1000,
  needsOtp,
  hashCode,
  signChallenge,
  readChallenge,
  maskEmail,
  issueOtp
};
