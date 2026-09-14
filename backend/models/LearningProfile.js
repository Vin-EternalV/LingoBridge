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
