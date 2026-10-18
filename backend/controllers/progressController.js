const Progress = require('../models/Progress');
const PracticeSession = require('../models/PracticeSession');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');

exports.getProgress = async (req, res, next) => {
  try {
    let progress = await Progress.findOne({ userId: req.user.id });
    
    // Auto-calculate if no document exists yet
    if (!progress) {
      progress = await Progress.create({ userId: req.user.id });
    }
    
    // Real-time aggregate could be done here, returning basic progress doc for now
    sendSuccess(res, progress, 'Progress retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const query = { userId: req.user.id };
    if (req.query.skill) {
      query.skill = req.query.skill;
    }
    
    const total = await PracticeSession.countDocuments(query);
    const sessions = await PracticeSession.find(query)
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);
      
    sendPaginated(res, sessions, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getSessionDetail = async (req, res, next) => {
  try {
    const session = await PracticeSession.findOne({ 
      _id: req.params.sessionId, 
      userId: req.user.id 
    });
    
    if (!session) {
      return sendError(res, 'Session not found', 404);
    }
    
    sendSuccess(res, session, 'Session details retrieved');
  } catch (err) {
    next(err);
  }
};
