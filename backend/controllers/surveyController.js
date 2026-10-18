const SurveyResponse = require('../models/SurveyResponse');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const SKILLS = ['grammar', 'vocabulary', 'reading', 'speaking', 'writing'];
const FREQUENCIES = ['never', 'rarely', 'weekly', 'several_times_week', 'daily'];

// POST /api/survey  (creates or updates the logged-in learner's survey)
exports.submitSurvey = async (req, res, next) => {
  try {
    const { difficulty, practiceFrequency, minutesPerSession, sessionsPerWeek } = req.body;

    if (!difficulty || typeof difficulty !== 'object') {
      return sendError(res, 'Difficulty ratings are required.', 400);
    }
    const cleanDifficulty = {};
    for (const skill of SKILLS) {
      const value = Number(difficulty[skill]);
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return sendError(res, `Difficulty for ${skill} must be a whole number from 1 to 5.`, 400);
      }
      cleanDifficulty[skill] = value;
    }

    if (!FREQUENCIES.includes(practiceFrequency)) {
      return sendError(res, 'Please choose how often you practice.', 400);
    }
    const minutes = Number(minutesPerSession);
    const sessions = Number(sessionsPerWeek);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      return sendError(res, 'Minutes per session must be between 1 and 600.', 400);
    }
    if (!Number.isInteger(sessions) || sessions < 1 || sessions > 50) {
      return sendError(res, 'Sessions per week must be between 1 and 50.', 400);
    }

    const survey = await SurveyResponse.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        difficulty: cleanDifficulty,
        practiceFrequency,
        minutesPerSession: minutes,
        sessionsPerWeek: sessions
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return sendSuccess(res, survey, 'Survey submitted', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/survey/me  (404 when the learner has not taken it yet)
exports.getMySurvey = async (req, res, next) => {
  try {
    const survey = await SurveyResponse.findOne({ userId: req.user.id });
    if (!survey) {
      return sendError(res, 'No survey submitted yet', 404);
    }
    return sendSuccess(res, survey, 'Survey retrieved');
  } catch (err) {
    next(err);
  }
};
