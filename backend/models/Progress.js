const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillProgressSchema = new Schema({
  totalSessions: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }
}, { _id: false });

const progressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skillProgress: {
    grammar: { type: skillProgressSchema, default: () => ({}) },
    vocabulary: { type: skillProgressSchema, default: () => ({}) },
    reading: { type: skillProgressSchema, default: () => ({}) },
    writing: { type: skillProgressSchema, default: () => ({}) },
    speaking: { type: skillProgressSchema, default: () => ({}) }
  },
  overallAccuracy: {
    type: Number,
    default: 0
  },
  totalPracticeSessions: {
    type: Number,
    default: 0
  },
  totalPracticeTime: {
    type: Number,
    default: 0
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastPracticeDate: Date
  },
  frequentlyMissedAreas: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
