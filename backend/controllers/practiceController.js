const PracticeSession = require('../models/PracticeSession');
const AIInteraction = require('../models/AIInteraction');
const Progress = require('../models/Progress');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.generateExercises = async (req, res, next) => {
  try {
    const { skill, topic, difficulty, learnerLevel, previousPerformance, count } = req.body;
    
    const { data: exercises, tokensUsed } = await aiService.generateExercise({ skill, topic, difficulty, learnerLevel, previousPerformance, count });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'exercise_generation',
      skill,
      prompt: `Generate ${skill} exercises for ${topic}`,
      response: exercises,
      tokensUsed,
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
    
    const { data: feedback, tokensUsed } = await aiService.evaluateAnswer({ exercise, userAnswer, learnerLevel });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'feedback',
      prompt: `Evaluate answer for exercise: ${JSON.stringify(exercise)}`,
      response: feedback,
      tokensUsed,
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
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return sendError(res, 'At least one exercise is required.', 400);
    }
    const session = await PracticeSession.create({
      userId: req.user.id,
      skill,
      topic,
      difficulty,
      exercises: exercises.map(exerciseData => ({ exerciseData })),
      totalQuestions: totalQuestions || exercises.length
    });
    
    sendSuccess(res, session, 'Practice session created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const allowed = ['exercises', 'score', 'totalQuestions', 'correctAnswers', 'accuracy', 'duration', 'status', 'completedAt'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const existing = await PracticeSession.findOne({ _id: req.params.id, userId: req.user.id }).select('status');
    if (!existing) return sendError(res, 'Session not found', 404);
    const session = await PracticeSession.findByIdAndUpdate(existing._id, update, { new: true, runValidators: true });
    
    if (session.status === 'completed' && existing.status !== 'completed') {
      const progress = await Progress.findOneAndUpdate({ userId: req.user.id }, { $setOnInsert: { userId: req.user.id } }, { new: true, upsert: true });
      const skill = progress.skillProgress[session.skill];
      skill.totalSessions += 1;
      skill.totalCorrect += session.correctAnswers;
      skill.totalQuestions += session.totalQuestions;
      skill.accuracy = skill.totalQuestions ? Math.round((skill.totalCorrect / skill.totalQuestions) * 100) : 0;
      progress.totalPracticeSessions += 1;
      progress.totalPracticeTime += session.duration || 0;
      const totalQuestions = Object.values(progress.skillProgress).reduce((sum, item) => sum + item.totalQuestions, 0);
      const totalCorrect = Object.values(progress.skillProgress).reduce((sum, item) => sum + item.totalCorrect, 0);
      progress.overallAccuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last = progress.streak.lastPracticeDate ? new Date(progress.streak.lastPracticeDate) : null;
      if (!last || last < today) {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        progress.streak.current = last && last >= yesterday ? progress.streak.current + 1 : 1;
        progress.streak.longest = Math.max(progress.streak.longest, progress.streak.current);
        progress.streak.lastPracticeDate = new Date();
      }
      await progress.save();
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
