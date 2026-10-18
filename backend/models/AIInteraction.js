const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const aiInteractionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['exercise_generation', 'feedback', 'assistant_chat'],
    required: true
  },
  skill: {
    type: String
  },
  prompt: {
    type: String
  },
  response: {
    type: Schema.Types.Mixed
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  },
  moderationFlag: {
    type: String,
    enum: ['code_or_prompt_abuse', 'sexual_content', 'violence', 'vulgar_or_gross_content', null],
    default: null
  },
  moderationAdminSeenAt: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('AIInteraction', aiInteractionSchema);
