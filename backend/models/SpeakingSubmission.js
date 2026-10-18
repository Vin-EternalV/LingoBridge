const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    wordCount: Number,
    comment: String,
    sampleAnswer: String,
  },
  { _id: false }
);

const correctionSchema = new Schema({ original: String, suggestion: String, reason: String }, { _id: false });

const speakingSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    part: { type: String, enum: ['part1', 'part2', 'part3'], required: true },
    title: String,
    bullets: [String], // Part 2 cue card points
    answers: [answerSchema],
    totalWords: Number,
    timeSpentSec: { type: Number, default: 0 },

    // Estimated bands (0-9, half steps). Pronunciation is not scored. Not official IELTS results.
    scores: {
      fluency: Number,
      lexical: Number,
      grammar: Number,
      overall: Number,
    },

    feedback: {
      summary: String,
      comments: { fluency: String, lexical: String, grammar: String },
      strengths: [String],
      improvements: [String],
      corrections: [correctionSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SpeakingSubmission', speakingSubmissionSchema);
