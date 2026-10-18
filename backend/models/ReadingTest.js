const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    type: { type: String, enum: ['heading', 'tfng', 'mcq', 'completion'], required: true },
    question: { type: String, required: true },
    options: [String],
    answer: { type: String, required: true }, // the answer key: never sent to the app before submitting
    acceptedAnswers: [String],
    paragraph: String,
    explanation: String,
    evidence: String,
  },
  { _id: false }
);

const readingTestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mockId: { type: Schema.Types.ObjectId, ref: 'MockTest' },
    title: String,
    paragraphs: [{ _id: false, label: String, text: String }],
    headings: [String],
    questions: [questionSchema],
    minutes: { type: Number, default: 20 },

    status: { type: String, enum: ['ready', 'submitted'], default: 'ready', index: true },
    answers: [String],
    correct: [Boolean],
    score: Number,
    total: Number,
    band: Number, // estimated, not an official IELTS result
    timeSpentSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReadingTest', readingTestSchema);
