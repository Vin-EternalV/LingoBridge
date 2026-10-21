const PracticeSession = require('../models/PracticeSession');
const LearningContent = require('../models/LearningContent');
const { logAIInteraction } = require('../utils/aiLogger');
const Progress = require('../models/Progress');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const LearningProfile = require('../models/LearningProfile');
const { normalizeLevel, DIFFICULTY_BY_LEVEL, LEVEL_REQUIREMENTS, SKILLS } = require('../utils/learningProgression');
const { validateCustomTopic, containsSexualTopic } = require('../utils/customTopicValidation');

exports.getLearningContent = async (req, res, next) => {
  try {
    const { skill } = req.query;
    const filter = { isActive: true };
    if (skill) filter.skill = skill;
    const content = await LearningContent.find(filter).sort('order topic').select('skill topic description difficulty');
    sendSuccess(res, content, 'Learning content retrieved');
  } catch (err) {
    next(err);
  }
};

exports.generateExercises = async (req, res, next) => {
  try {
    const { skill, topic, difficulty, previousPerformance, count, isCustomTopic } = req.body;
    if (!SKILLS.includes(skill)) return sendError(res, 'Choose one of the five learning skills.', 400);
    if (containsSexualTopic(typeof topic === 'string' ? topic : '')) {
      return sendError(res, 'Sexual content is not allowed. Choose a safe English-learning topic.', 400);
    }
    if (isCustomTopic) {
      const topicError = validateCustomTopic(topic);
      if (topicError) return sendError(res, topicError, 400);
    }
    const profile = await LearningProfile.findOne({ userId: req.user.id });
    if (!profile?.onboardingComplete) return sendError(res, 'Complete your learning preferences before starting practice.', 403);
    const level = normalizeLevel(profile.currentEnglishLevel || profile.englishLevel);
    if (!DIFFICULTY_BY_LEVEL[level].includes(difficulty)) {
      return sendError(res, `This difficulty is locked. Your available difficulty is ${DIFFICULTY_BY_LEVEL[level].join(' or ')}.`, 403);
    }
    const safeCount = Math.max(5, Math.min(Number.parseInt(count, 10) || 8, 10));
    const { data: generated, tokensUsed } = await aiService.generateExercise({ skill, topic, difficulty, learnerLevel: level, previousPerformance, count: safeCount });
    const exercises = Array.isArray(generated) ? generated : generated?.exercises;
    if (!Array.isArray(exercises) || exercises.length < 5) return sendError(res, 'The exercise could not be prepared. Please try again.', 502);
    const session = await PracticeSession.create({
      userId: req.user.id, skill, topic, difficulty, levelAtStart: level, serverValidated: true,
      exercises: exercises.map((exerciseData) => ({ exerciseData })), totalQuestions: exercises.length,
    });
    
    await logAIInteraction(req.user, {
      type: 'exercise_generation',
      skill,
      prompt: `Generate ${skill} exercises for ${topic}`,
      response: exercises,
      tokensUsed,
      success: true
    });
    
    sendSuccess(res, { exercises, sessionId: session._id, level }, 'Exercises generated and session created successfully');
  } catch (err) {
    await logAIInteraction(req.user, {
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
    
    await logAIInteraction(req.user, {
      type: 'feedback',
      prompt: `Evaluate answer for exercise: ${JSON.stringify(exercise)}`,
      response: feedback,
      tokensUsed,
      success: true
    });
    
    sendSuccess(res, feedback, 'Answer evaluated successfully');
  } catch (err) {
    await logAIInteraction(req.user, {
      type: 'feedback',
      success: false,
      errorMessage: err.message
    });
    next(err);
  }
};

exports.createSession = async (req, res, next) => {
  return sendError(res, 'Sessions are created when the server prepares your exercises. Please start a new session.', 410);
};

exports.updateSession = async (req, res, next) => {
  try {
    const existing = await PracticeSession.findOne({ _id: req.params.id, userId: req.user.id }).select('status serverValidated');
    if (!existing) return sendError(res, 'Session not found', 404);
    if (existing.serverValidated) return sendError(res, 'Answers and completion are saved automatically by the server.', 403);
    const session = await PracticeSession.findByIdAndUpdate(existing._id, { $set: { status: 'abandoned' } }, { new: true });
    sendSuccess(res, session, 'Legacy session closed. Start a new server-validated session to earn progression credit.');
  } catch (err) {
    next(err);
  }
};

exports.answerSession = async (req, res, next) => {
  try {
    const { index, userAnswer } = req.body;
    if (!Number.isInteger(index) || index < 0 || typeof userAnswer !== 'string' || !userAnswer.trim() || userAnswer.length > 2000) {
      return sendError(res, 'Submit a valid answer for the current question.', 400);
    }
    const session = await PracticeSession.findOne({ _id: req.params.id, userId: req.user.id, serverValidated: true });
    if (!session) return sendError(res, 'Session not found', 404);
    if (session.exercises[index]?.userAnswer) {
      return sendSuccess(res, { feedback: session.exercises[index].feedback, currentIndex: session.currentIndex, completed: session.status === 'completed', duplicate: true }, 'Answer already saved');
    }
    if (session.status !== 'in_progress' || index !== session.currentIndex || index >= session.exercises.length) {
      return sendError(res, 'This answer is not for the current question.', 409);
    }
    const exercise = session.exercises[index].exerciseData;
    const { data: feedback } = await aiService.evaluateAnswer({ exercise, userAnswer, learnerLevel: session.levelAtStart });
    const isLast = index === session.exercises.length - 1;
    const set = {
      [`exercises.${index}.userAnswer`]: userAnswer.trim(),
      [`exercises.${index}.isCorrect`]: !!feedback.isCorrect,
      [`exercises.${index}.score`]: Number(feedback.score) || (feedback.isCorrect ? 1 : 0),
      [`exercises.${index}.feedback`]: feedback,
      [`exercises.${index}.answeredAt`]: new Date(),
      currentIndex: index + 1,
    };
    if (isLast) {
      const elapsed = Math.max(1, Math.round((Date.now() - session.createdAt.getTime()) / 60000));
      set.status = 'completed';
      set.completedAt = new Date();
      set.duration = elapsed;
    }
    const saved = await PracticeSession.findOneAndUpdate(
      { _id: session._id, userId: req.user.id, status: 'in_progress', currentIndex: index },
      { $set: set, $inc: { correctAnswers: feedback.isCorrect ? 1 : 0 } },
      { new: true, runValidators: true }
    );
    if (!saved) {
      const latest = await PracticeSession.findById(session._id);
      return sendSuccess(res, { feedback: latest?.exercises[index]?.feedback, currentIndex: latest?.currentIndex || 0, completed: latest?.status === 'completed', duplicate: true }, 'Answer already saved');
    }
    saved.score = saved.currentIndex ? Math.round((saved.correctAnswers / saved.currentIndex) * 100) : 0;
    saved.accuracy = saved.score;
    await saved.save();
    const advancement = isLast ? await creditCompletedSession(saved, req.user.id) : null;
    sendSuccess(res, { feedback, currentIndex: saved.currentIndex, completed: isLast, levelAdvanced: !!advancement?.advanced, newLevel: advancement?.newLevel || null, session: isLast ? saved : undefined }, 'Answer saved');
  } catch (err) { next(err); }
};

async function creditCompletedSession(session, userId) {
  const counted = await PracticeSession.findOneAndUpdate(
    { _id: session._id, progressionCounted: false, serverValidated: true, status: 'completed' },
    { $set: { progressionCounted: true } }, { new: true }
  );
  if (!counted) return null;

  const progress = await Progress.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { new: true, upsert: true });
  const skill = progress.skillProgress[session.skill];
  skill.totalSessions += 1; skill.totalCorrect += session.correctAnswers; skill.totalQuestions += session.totalQuestions;
  skill.accuracy = skill.totalQuestions ? Math.round((skill.totalCorrect / skill.totalQuestions) * 100) : 0;
  progress.totalPracticeSessions += 1; progress.totalPracticeTime += session.duration || 0;
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

  const level = session.levelAtStart;
  const perSkill = LEVEL_REQUIREMENTS[level];
  if (!SKILLS.includes(session.skill)) return null;
  if (level === 'advanced') {
    const advancedField = `levelProgress.advanced.${session.skill}`;
    await LearningProfile.findOneAndUpdate({ userId, currentEnglishLevel: 'advanced' }, { $inc: { [advancedField]: 1 } });
    return null;
  }
  if (!perSkill) return null;
  const field = `levelProgress.${level}.${session.skill}`;
  await LearningProfile.findOneAndUpdate(
    { userId, currentEnglishLevel: level, [field]: { $lt: perSkill } },
    { $inc: { [field]: 1 } }
  );
  const profile = await LearningProfile.findOne({ userId });
  const counts = profile?.levelProgress?.[level];
  if (!profile || !SKILLS.every((item) => (counts?.[item] || 0) >= perSkill)) return null;
  const next = level === 'beginner' ? 'intermediate' : level === 'intermediate' ? 'advanced' : null;
  if (!next) return null;
  const completedAtField = level === 'beginner' ? 'beginnerCompletedAt' : 'intermediateCompletedAt';
  const result = await LearningProfile.updateOne(
    { userId, currentEnglishLevel: level },
    { $set: { currentEnglishLevel: next, englishLevel: next, [completedAtField]: new Date() } }
  );
  return result.modifiedCount ? { advanced: true, newLevel: next } : null;
}

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
