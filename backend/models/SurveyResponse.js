const mongoose = require('mongoose');

const difficultyField = { type: Number, min: 1, max: 5, default: 3 };

const surveyResponseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one survey per learner; resubmitting updates it
      index: true
    },
    difficulty: {
      grammar: difficultyField,
      vocabulary: difficultyField,
      reading: difficultyField,
      speaking: difficultyField,
      writing: difficultyField
    },
    practiceFrequency: {
      type: String,
      enum: ['never', 'rarely', 'weekly', 'several_times_week', 'daily'],
      default: 'weekly'
    },
    minutesPerSession: { type: Number, min: 1, max: 600, default: 30 },
    sessionsPerWeek: { type: Number, min: 1, max: 50, default: 3 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
