// controllers/aiController.js
const aiService = require("../services/aiService");
const { logAIInteraction } = require("../utils/aiLogger");
const AIInteraction = require("../models/AIInteraction");
const LearningProfile = require("../models/LearningProfile");
const SurveyResponse = require("../models/SurveyResponse"); // NEW
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const SKILLS = ["grammar", "vocabulary", "reading", "speaking", "writing"];

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
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

    const moderationFlag = /\b(?:developer\s+mode|jailbreak|prompt\s+injection)\b|\b(?:ignore|disregard|forget|override|bypass|reveal|repeat)\b[\s\S]{0,80}\b(?:system|developer|previous|prior|above|instructions?|rules?|prompt|policy)\b|\b(?:act|pretend|role[ -]?play)\s+(?:as|to be)\b|\b(?:css|html|javascript|typescript|python|java|react|node\.?js|sql|programming|coding)\b|\b(?:write|generate|debug|build|fix)\b.{0,50}\b(?:code|script|website|stylesheet|app)\b/i.test(message)
      ? 'off_topic_or_prompt_abuse'
      : null;

    const [account, learningProfile] = await Promise.all([
      User.findById(req.user.id).select("nativeLanguage"),
      LearningProfile.findOne({ userId: req.user.id }).select("englishLevel"),
    ]);
    // Rebuild context from this user's saved turns. Never trust client-supplied
    // assistant messages, which could impersonate the system or tutor.
    const previousTurns = req.user.settings?.privacy?.saveAiHistory === false
      ? []
      : await AIInteraction.find({
          userId: req.user.id,
          type: "assistant_chat",
          success: true,
          prompt: { $type: "string" },
          response: { $exists: true },
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("prompt response")
          .lean();
    const historyMessages = previousTurns.reverse().flatMap((turn) => [
      { role: "user", content: turn.prompt },
      { role: "assistant", content: turn.response?.response || "" },
    ]).filter((item) => item.content);

    const { data, tokensUsed } = await aiService.chatAssistant({
      messages: [...historyMessages, { role: "user", content: message }],
      learnerLevel: learningProfile?.englishLevel,
      nativeLanguage: account?.nativeLanguage,
    });

    await logAIInteraction(req.user, {
      type: "assistant_chat",
      prompt: message,
      response: data,
      tokensUsed,
      success: true,
      moderationFlag,
    });

    sendSuccess(res, data, "Chat response generated");
  } catch (err) {
    await logAIInteraction(req.user, {
      type: "assistant_chat",
      success: false,
      errorMessage: err.message,
    });
    next(err);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const enabled = req.user.settings?.privacy?.saveAiHistory !== false;
    if (!enabled) return sendSuccess(res, { enabled: false, messages: [] }, "AI history is disabled");

    const turns = await AIInteraction.find({
      userId: req.user.id,
      type: "assistant_chat",
      success: true,
      prompt: { $type: "string" },
      response: { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("prompt response createdAt")
      .lean();

    const messages = turns.reverse().flatMap((turn) => [
      { role: "user", content: turn.prompt, createdAt: turn.createdAt },
      { role: "assistant", content: turn.response?.response || "", createdAt: turn.createdAt },
    ]).filter((item) => item.content);
    sendSuccess(res, { enabled: true, messages }, "AI history retrieved");
  } catch (err) {
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
