const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const practiceSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    enum: ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  exercises: [{
    exerciseData: Schema.Types.Mixed,
    userAnswer: Schema.Types.Mixed,
    isCorrect: Boolean,
    score: Number,
    feedback: {
      isCorrect: Boolean,
      score: Number,
      correctAnswer: Schema.Types.Mixed,
      explanation: String,
      whyIncorrect: String,
      example: String,
      suggestedImprovement: String
    },
    answeredAt: Date
  }],
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);
