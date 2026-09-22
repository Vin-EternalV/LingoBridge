// controllers/aiController.js
const aiService = require("../services/aiService");
const AIInteraction = require("../models/AIInteraction");
const SurveyResponse = require("../models/SurveyResponse"); // NEW
const { sendSuccess, sendError } = require("../utils/responseHelper");

const SKILLS = ["grammar", "vocabulary", "reading", "speaking", "writing"];

exports.chat = async (req, res, next) => {
  try {
    const { message, chatHistory, learnerLevel } = req.body;
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length > 1000
    ) {
      return sendError(
        res,
        "A message up to 1,000 characters is required.",
        400,
      );
    }

    const { data, tokensUsed } = await aiService.chatAssistant({
      messages: [...(chatHistory || []), { role: "user", content: message }],
      learnerLevel,
    });

    await AIInteraction.create({
      userId: req.user.id,
      type: "assistant_chat",
      prompt: message,
      response: data,
      tokensUsed,
      success: true,
    });

    sendSuccess(res, data, "Chat response generated");
  } catch (err) {
    await AIInteraction.create({
      userId: req.user.id,
      type: "assistant_chat",
      success: false,
      errorMessage: err.message,
    });
    next(err);
  }
};

/**
 * Real personalized suggestions based on the learner's own survey
 * (or the aggregate hardest skill if the user has no survey yet).
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    let weakest = null;

    // 1. Try the user's own survey
    if (req.user?.id) {
      const survey = await SurveyResponse.findOne({ userId: req.user.id });
      if (survey?.difficulty) {
        const entries = Object.entries(survey.difficulty.toObject()).filter(
          ([k]) => SKILLS.includes(k),
        );
        entries.sort((a, b) => b[1] - a[1]);
        weakest = entries[0][0];
      }
    }

    // 2. Fallback — aggregate hardest skill across all surveys
    if (!weakest) {
      const [agg] = await SurveyResponse.aggregate([
        {
          $group: {
            _id: null,
            grammar: { $avg: "$difficulty.grammar" },
            vocabulary: { $avg: "$difficulty.vocabulary" },
            reading: { $avg: "$difficulty.reading" },
            speaking: { $avg: "$difficulty.speaking" },
            writing: { $avg: "$difficulty.writing" },
          },
        },
      ]);
      if (agg) {
        weakest = Object.entries(agg)
          .filter(([k]) => k !== "_id")
          .sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    const topicMap = {
      grammar: "Present Perfect vs Simple Past",
      vocabulary: "Academic Word List – Sublist 1",
      reading: "Skimming & Scanning Strategies",
      writing: "Cohesive Devices in Essays",
      speaking: "Everyday Conversation Starters",
    };

    const pick = weakest || "grammar";

    const suggestions = [
      {
        skill: pick,
        topic: topicMap[pick],
        reason: "This is your highest-difficulty area based on your survey.",
        priority: "high",
      },
      {
        skill: "vocabulary",
        topic: "Daily 5-Word Flashcards",
        reason: "Build consistent vocabulary habits.",
        priority: "medium",
      },
    ];

    return sendSuccess(
      res,
      { weakestSkill: weakest, suggestions },
      "Suggestions retrieved",
    );
  } catch (err) {
    next(err);
  }
};
