const User = require('../models/User');
const PracticeSession = require('../models/PracticeSession');
const AIInteraction = require('../models/AIInteraction');
const LearningContent = require('../models/LearningContent');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');

const createAuditLog = async (req, action, target, targetId, details) => {
  try {
    await AuditLog.create({
      adminId: req.user.id,
      adminName: `${req.user.firstName} ${req.user.lastName}`,
      action,
      target,
      targetId,
      details,
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeLearners = await User.countDocuments({ isActive: true, role: 'learner' });
    const totalPracticeSessions = await PracticeSession.countDocuments();
    const totalAIInteractions = await AIInteraction.countDocuments();
    
    const topSkills = await PracticeSession.aggregate([
      { $group: { _id: '$skill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    sendSuccess(res, {
      totalUsers,
      activeLearners,
      totalPracticeSessions,
      totalAIInteractions,
      topSkills: topSkills.map(s => ({ skill: s._id, count: s.count }))
    }, 'Dashboard stats retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    let query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(startIndex).limit(limit).sort('-createdAt');
    
    sendPaginated(res, users, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    
    user.isActive = !user.isActive;
    await user.save();
    
    await createAuditLog(req, 'toggle_user_status', 'User', user._id, { newStatus: user.isActive });
    
    sendSuccess(res, user, `User status updated to ${user.isActive ? 'active' : 'inactive'}`);
  } catch (err) {
    next(err);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const content = await LearningContent.find().sort('order');
    sendSuccess(res, content, 'Content retrieved');
  } catch (err) {
    next(err);
  }
};

exports.createContent = async (req, res, next) => {
  try {
    const content = await LearningContent.create(req.body);
    await createAuditLog(req, 'create_content', 'LearningContent', content._id, { topic: content.topic });
    sendSuccess(res, content, 'Content created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const content = await LearningContent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!content) return sendError(res, 'Content not found', 404);
    await createAuditLog(req, 'update_content', 'LearningContent', content._id, { topic: content.topic });
    sendSuccess(res, content, 'Content updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    const content = await LearningContent.findById(req.params.id);
    if (!content) return sendError(res, 'Content not found', 404);
    await content.deleteOne();
    await createAuditLog(req, 'delete_content', 'LearningContent', req.params.id, { topic: content.topic });
    sendSuccess(res, null, 'Content deleted');
  } catch (err) {
    next(err);
  }
};

exports.getAIActivityStats = async (req, res, next) => {
  try {
    const stats = await AIInteraction.aggregate([
      { $group: {
          _id: '$type',
          count: { $sum: 1 },
          successful: { $sum: { $cond: ['$success', 1, 0] } }
        }
      }
    ]);
    const byType = Object.fromEntries(stats.map(item => [item._id, item]));
    const total = stats.reduce((sum, item) => sum + item.count, 0);
    const successful = stats.reduce((sum, item) => sum + item.successful, 0);
    sendSuccess(res, {
      totalExercisesGenerated: byType.exercise_generation?.count || 0,
      totalEvaluations: byType.feedback?.count || 0,
      totalChatInteractions: byType.assistant_chat?.count || 0,
      successRate: total ? Math.round((successful / total) * 1000) / 10 : 0,
      byType: stats
    }, 'AI Activity Stats retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const [completedSessions, duration, skillDistribution] = await Promise.all([
      PracticeSession.find({ status: 'completed' }).select('accuracy duration'),
      PracticeSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, averageDuration: { $avg: '$duration' }, averageAccuracy: { $avg: '$accuracy' } } }]),
      PracticeSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$skill', sessions: { $sum: 1 }, averageAccuracy: { $avg: '$accuracy' } } }, { $sort: { sessions: -1 } }])
    ]);
    const reports = {
      completedSessions: completedSessions.length,
      averagePracticeDuration: Math.round(duration[0]?.averageDuration || 0),
      averageAccuracy: Math.round(duration[0]?.averageAccuracy || 0),
      skillDistribution
    };
    sendSuccess(res, reports, 'Reports retrieved');
  } catch (err) {
    next(err);
  }
};
