const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const correctionSchema = new Schema(
  { original: String, suggestion: String, reason: String },
  { _id: false }
);

const writingSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    task: { type: String, enum: ['task1', 'task2'], required: true },
    module: { type: String, enum: ['academic', 'general'], default: 'academic' },

    prompt: {
      title: String,
      question: { type: String, required: true },
      bullets: [String],
      table: {
        caption: String,
        headers: [String],
        rows: [[String]],
      },
    },

    essay: { type: String, required: true },
    wordCount: { type: Number, required: true },
    minWords: { type: Number, required: true },
    timeSpentSec: { type: Number, default: 0 },

    // Estimated bands (0-9, half steps). Not official IELTS results.
    scores: {
      taskResponse: Number,
      coherence: Number,
      lexical: Number,
      grammar: Number,
      overall: Number,
    },

    feedback: {
      summary: String,
      comments: {
        taskResponse: String,
        coherence: String,
        lexical: String,
        grammar: String,
      },
      strengths: [String],
      improvements: [String],
      corrections: [correctionSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WritingSubmission', writingSubmissionSchema);
