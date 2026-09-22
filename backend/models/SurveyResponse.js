// models/SurveyResponse.js
const mongoose = require("mongoose");

const skillRating = {
  grammar: { type: Number, min: 1, max: 5, required: true },
  vocabulary: { type: Number, min: 1, max: 5, required: true },
  reading: { type: Number, min: 1, max: 5, required: true },
  speaking: { type: Number, min: 1, max: 5, required: true },
  writing: { type: Number, min: 1, max: 5, required: true },
};

const surveySchema = new mongoose.Schema(
  {
    // Optional — link to a logged-in user, otherwise anonymous
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Demographics
    age: { type: Number, min: 10, max: 80 },
    yearLevel: {
      type: String,
      enum: ["junior_high", "senior_high", "college", "graduate", "other"],
    },
    school: { type: String, trim: true },

    // Perceived difficulty (1 = very easy, 5 = very hard)
    difficulty: skillRating,

    // Independent practice habits
    practiceFrequency: {
      type: String,
      enum: ["never", "rarely", "weekly", "several_times_week", "daily"],
      required: true,
    },
    minutesPerSession: { type: Number, min: 0, max: 600, default: 0 },
    sessionsPerWeek: { type: Number, min: 0, max: 50, default: 0 },
    studyOutsideFormal: { type: Boolean, default: false },

    // Free text
    biggestChallenge: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

surveySchema.index({ createdAt: -1 });
surveySchema.index({ userId: 1 });

module.exports = mongoose.model("SurveyResponse", surveySchema);
