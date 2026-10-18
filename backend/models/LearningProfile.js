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
