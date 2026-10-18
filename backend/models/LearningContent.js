const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const learningContentSchema = new Schema({
  skill: {
    type: String,
    enum: ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  description: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningContent', learningContentSchema);
