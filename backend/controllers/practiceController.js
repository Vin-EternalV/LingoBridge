const PracticeSession = require('../models/PracticeSession');
const AIInteraction = require('../models/AIInteraction');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.generateExercises = async (req, res, next) => {
  try {
    const { skill, topic, difficulty, learnerLevel, previousPerformance, count } = req.body;
    
    const exercises = await aiService.generateExercise({ skill, topic, difficulty, learnerLevel, previousPerformance, count });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'exercise_generation',
      skill,
      prompt: `Generate ${skill} exercises for ${topic}`,
      response: exercises,
      success: true
    });
    
    sendSuccess(res, exercises, 'Exercises generated successfully');
  } catch (err) {
    await AIInteraction.create({
      userId: req.user.id,
      type: 'exercise_generation',
      skill: req.body.skill,
      success: false,
      errorMessage: err.message
    });
    next(err);
  }
};

exports.submitAnswer = async (req, res, next) => {
  try {
    const { exercise, userAnswer, learnerLevel } = req.body;
    
    const feedback = await aiService.evaluateAnswer({ exercise, userAnswer, learnerLevel });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'feedback',
      prompt: `Evaluate answer for exercise: ${JSON.stringify(exercise)}`,
      response: feedback,
      success: true
    });
    
    sendSuccess(res, feedback, 'Answer evaluated successfully');
  } catch (err) {
    await AIInteraction.create({
      userId: req.user.id,
      type: 'feedback',
      success: false,
      errorMessage: err.message
    });
    next(err);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const { skill, topic, difficulty, exercises, totalQuestions } = req.body;
    
    const session = await PracticeSession.create({
      userId: req.user.id,
      skill,
      topic,
      difficulty,
      exercises,
      totalQuestions
    });
    
    sendSuccess(res, session, 'Practice session created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return sendError(res, 'Session not found', 404);
    }
    
    sendSuccess(res, session, 'Practice session updated');
  } catch (err) {
    next(err);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await PracticeSession.find({ userId: req.user.id }).sort('-createdAt');
    sendSuccess(res, sessions, 'Sessions retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const session = await PracticeSession.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) {
      return sendError(res, 'Session not found', 404);
    }
    sendSuccess(res, session, 'Session retrieved');
  } catch (err) {
    next(err);
  }
};
