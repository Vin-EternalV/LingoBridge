const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    type: { type: String, enum: ['completion', 'mcq', 'matching'], required: true },
    question: { type: String, required: true },
    options: [String],
    answer: { type: String, required: true }, // the answer key: never sent to the app before submitting
    acceptedAnswers: [String],
    explanation: String,
    evidence: String,
  },
  { _id: false }
);

const listeningTestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mockId: { type: Schema.Types.ObjectId, ref: 'MockTest' },
    kind: { type: String, enum: ['conversation', 'talk'], required: true },
    title: String,
    context: String, // "You will hear a conversation between ..."
    turns: [{ _id: false, speaker: String, text: String }],
    matchTitle: String,
    matchOptions: [String],
    questions: [questionSchema],

    // Server-made audio: none = not used (the phone or browser voice reads the script), pending = being made,
    // ready = a WAV file is waiting, failed = it could not be made (the app falls back to the device voice).
    audioStatus: { type: String, enum: ['none', 'pending', 'ready', 'failed'], default: 'none' },
    audioBytes: Number,
    audioError: String,

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

module.exports = mongoose.model('ListeningTest', listeningTestSchema);
