const mongoose = require('mongoose');

const learningProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  englishLevel: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced']
  },
  startingEnglishLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  currentEnglishLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  levelProgress: {
    beginner: { grammar: { type: Number, default: 0 }, vocabulary: { type: Number, default: 0 }, reading: { type: Number, default: 0 }, writing: { type: Number, default: 0 }, speaking: { type: Number, default: 0 } },
    intermediate: { grammar: { type: Number, default: 0 }, vocabulary: { type: Number, default: 0 }, reading: { type: Number, default: 0 }, writing: { type: Number, default: 0 }, speaking: { type: Number, default: 0 } },
    advanced: { grammar: { type: Number, default: 0 }, vocabulary: { type: Number, default: 0 }, reading: { type: Number, default: 0 }, writing: { type: Number, default: 0 }, speaking: { type: Number, default: 0 } },
  },
  beginnerCompletedAt: Date,
  intermediateCompletedAt: Date,
  identityVerification: {
    status: { type: String, enum: ['not_requested', 'pending', 'verified', 'rejected'], default: 'not_requested' },
    requestedAt: Date,
    reviewedAt: Date,
    adminSeenAt: Date,
    learnerSeenAt: Date,
    // Storage key and MIME type are intentionally excluded from normal profile queries.
    documentKey: { type: String, select: false },
    documentMimeType: { type: String, select: false, enum: ['image/jpeg', 'image/png', 'image/webp'] },
    documentUploadedAt: Date,
  },
  learningGoals: [{
    type: String
  }],
  preferredAreas: [{
    type: String
  }],
  areasOfDifficulty: [{
    type: String
  }],
  dailyGoalMinutes: {
    type: Number,
    default: 15,
    min: [5, 'Daily goal must be at least 5 minutes'],
    max: [240, 'Daily goal cannot exceed 240 minutes']
  },
  weeklyGoalSessions: {
    type: Number,
    default: 5,
    min: [1, 'Weekly goal must be at least 1 session'],
    max: [21, 'Weekly goal cannot exceed 21 sessions']
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastPracticeDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningProfile', learningProfileSchema);
