const mongoose = require('mongoose');

// One active verification code per user. The code itself is never stored, only a keyed hash.
const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 'register' = confirming a new email address, 'login' = second step of signing in
  purpose: {
    type: String,
    enum: ['register', 'login', 'admin_setup'],
    required: true
  },
  codeHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  // MongoDB deletes the document by itself once this time has passed.
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

module.exports = mongoose.model('Otp', otpSchema);
