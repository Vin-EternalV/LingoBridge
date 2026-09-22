// controllers/surveyController.js
const SurveyResponse = require("../models/SurveyResponse");
const { sendSuccess, sendError } = require("../utils/responseHelper");

/**
 * POST /api/survey
 * Public — a learner (logged in or anonymous) submits a survey.
 */
exports.submitSurvey = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user?.id) payload.userId = req.user.id;

    const doc = await SurveyResponse.create(payload);
    return sendSuccess(res, doc, "Survey submitted. Thank you!", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/survey
 * Admin only — list survey responses (paginated).
 */
exports.listSurveys = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      SurveyResponse.countDocuments(),
      SurveyResponse.find().sort("-createdAt").skip(skip).limit(limit),
    ]);

    return sendSuccess(
      res,
      { total, page, limit, count: docs.length, docs },
      "Surveys retrieved",
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/survey/me
 * A logged-in learner can fetch their own submission.
 */
exports.getMySurvey = async (req, res, next) => {
  try {
    const doc = await SurveyResponse.findOne({ userId: req.user.id }).sort(
      "-createdAt",
    );
    if (!doc) return sendError(res, "You have not submitted a survey yet", 404);
    return sendSuccess(res, doc, "Your survey retrieved");
  } catch (err) {
    next(err);
  }
};
