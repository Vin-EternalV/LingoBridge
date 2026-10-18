const mongoose = require('mongoose');

// Small per-learner IELTS settings (right now just the target band).
const ieltsProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    targetBand: { type: Number, min: 4, max: 9 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IeltsProfile', ieltsProfileSchema);
