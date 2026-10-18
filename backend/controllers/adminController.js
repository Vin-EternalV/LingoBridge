const User = require('../models/User');
const PracticeSession = require('../models/PracticeSession');
const AIInteraction = require('../models/AIInteraction');
const LearningContent = require('../models/LearningContent');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const LearningProfile = require('../models/LearningProfile');
const { ageOnDate } = require('../utils/learningProgression');
const fs = require('fs/promises');
const { getDocumentPath, removeDocument } = require('../utils/identityDocuments');

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

exports.getIdentityVerifications = async (req, res, next) => {
  try {
    const profiles = await LearningProfile.find({ 'identityVerification.status': { $in: ['pending', 'verified', 'rejected'] } })
      .select('userId currentEnglishLevel englishLevel identityVerification.status identityVerification.requestedAt identityVerification.documentUploadedAt +identityVerification.documentKey')
      .sort('-identityVerification.requestedAt').limit(200).lean();
    const users = await User.find({ _id: { $in: profiles.map((item) => item.userId) } }).select('firstName lastName email dateOfBirth').lean();
    const byId = new Map(users.map((user) => [String(user._id), user]));
    sendSuccess(res, profiles.map((profile) => {
      const user = byId.get(String(profile.userId));
      return {
        userId: profile.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        ageEligible: ageOnDate(user?.dateOfBirth) >= 18,
        levelEligible: (profile.currentEnglishLevel || profile.englishLevel) === 'advanced',
        status: profile.identityVerification?.status,
        requestedAt: profile.identityVerification?.requestedAt,
        hasIdDocument: Boolean(profile.identityVerification?.documentKey),
        documentUploadedAt: profile.identityVerification?.documentUploadedAt || null,
      };
    }), 'Identity verification requests retrieved');
  } catch (err) { next(err); }
};

exports.reviewIdentityVerification = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) return sendError(res, 'Choose verified or rejected.', 400);
    const profile = await LearningProfile.findOne({ userId: req.params.id })
      .select('+identityVerification.documentKey +identityVerification.documentMimeType');
    const user = await User.findById(req.params.id).select('dateOfBirth');
    if (!profile || !user) return sendError(res, 'Learner not found', 404);
    const age = ageOnDate(user.dateOfBirth);
    if (status === 'verified' && (age === null || age < 18 || (profile.currentEnglishLevel || profile.englishLevel) !== 'advanced')) {
      return sendError(res, 'The learner must be at least 18 and at Advanced English before verification can be approved.', 403);
    }
    if (!['pending', 'rejected'].includes(profile.identityVerification?.status)) return sendError(res, 'No verification request is awaiting review.', 409);
    if (status === 'verified') {
      const documentPath = getDocumentPath(profile.identityVerification?.documentKey, profile.identityVerification?.documentMimeType);
      if (!documentPath) return sendError(res, 'Approval blocked: the learner must upload a government-issued ID image first.', 409);
      try { await fs.access(documentPath); }
      catch { return sendError(res, 'Approval blocked: the uploaded ID image is unavailable. Ask the learner to upload it again.', 409); }
    }
    const documentKey = profile.identityVerification?.documentKey;
    const documentMimeType = profile.identityVerification?.documentMimeType;
    profile.set('identityVerification.status', status);
    profile.set('identityVerification.reviewedAt', new Date());
    profile.set('identityVerification.learnerSeenAt', undefined);
    if (status === 'verified' || status === 'rejected') {
      profile.set('identityVerification.documentKey', undefined);
      profile.set('identityVerification.documentMimeType', undefined);
    }
    await profile.save();
    // Keep the image only while a request awaits review.
    if (documentKey && (status === 'verified' || status === 'rejected')) {
      await removeDocument(documentKey, documentMimeType).catch(() => {});
    }
    await createAuditLog(req, 'identity_verification_reviewed', 'learner', req.params.id, { status });
    sendSuccess(res, { userId: req.params.id, status }, 'Verification status updated');
  } catch (err) { next(err); }
};

exports.getIdentityDocument = async (req, res, next) => {
  try {
    const profile = await LearningProfile.findOne({ userId: req.params.id })
      .select('+identityVerification.documentKey +identityVerification.documentMimeType');
    const filePath = getDocumentPath(profile?.identityVerification?.documentKey, profile?.identityVerification?.documentMimeType);
    if (!filePath) return sendError(res, 'No government ID image is available for this learner.', 404);
    const image = await fs.readFile(filePath).catch(() => null);
    if (!image) return sendError(res, 'The uploaded ID image is unavailable.', 404);
    res.set('Cache-Control', 'no-store, private');
    res.set('Pragma', 'no-cache');
    await createAuditLog(req, 'identity_document_viewed', 'learner', req.params.id, { status: profile.identityVerification?.status });
    sendSuccess(res, {
      mimeType: profile.identityVerification.documentMimeType,
      base64: image.toString('base64'),
    }, 'Identity document retrieved');
  } catch (err) { next(err); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 6);
    const [totalUsers, activeLearners, totalPracticeSessions, totalAIInteractions, topSkills, sessionTrend, sessionStatuses] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, role: 'learner' }),
      PracticeSession.countDocuments(),
      AIInteraction.countDocuments(),
      PracticeSession.aggregate([
        { $group: { _id: '$skill', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      PracticeSession.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      PracticeSession.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    
    sendSuccess(res, {
      totalUsers,
      activeLearners,
      totalPracticeSessions,
      totalAIInteractions,
      topSkills: topSkills.map(s => ({ skill: s._id, count: s.count })),
      sessionTrend,
      sessionStatuses: Object.fromEntries(sessionStatuses.map(({ _id, count }) => [_id, count]))
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
      const searchRegex = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(startIndex).limit(limit).sort('-createdAt');
    
    sendPaginated(res, users, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/status   { isActive?: boolean }
// Who can change whose status:
//   - nobody can change their own status
//   - superadmin accounts can never be disabled from here
//   - an admin can manage learners only
//   - a superadmin can manage learners and admins
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (String(user._id) === String(req.user._id)) {
      return sendError(res, "You can't change your own account status", 400);
    }
    if (user.role === 'superadmin') {
      return sendError(res, 'Superadmin accounts cannot be disabled', 403);
    }
    if (user.role === 'admin' && req.user.role !== 'superadmin') {
      return sendError(res, 'Only a superadmin can change an admin account', 403);
    }

    // Use the status the app asked for if it sent one, otherwise flip it.
    const next = typeof req.body.isActive === 'boolean' ? req.body.isActive : !user.isActive;
    user.isActive = next;
    if (next) user.suspension = { until: null, reason: '' };
    if (!next) user.tokenVersion = (user.tokenVersion || 0) + 1; // signs them out on every device
    await user.save({ validateBeforeSave: false });

    await createAuditLog(req, 'toggle_user_status', 'User', user._id, { newStatus: user.isActive });

    sendSuccess(res, user, `User status updated to ${user.isActive ? 'active' : 'inactive'}`);
  } catch (err) {
    next(err);
  }
};

exports.suspendLearner = async (req, res, next) => {
  try {
    const days = req.body.days;
    if (!(days === null || (Number.isInteger(days) && days >= 1 && days <= 3650))) {
      return sendError(res, 'Choose a suspension from 1 to 3,650 days, or null for a permanent ban.', 400);
    }
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    if (!reason) return sendError(res, 'A reason is required.', 400);
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (user.role !== 'learner') return sendError(res, 'Only learner accounts can be suspended here.', 403);
    user.isActive = false;
    user.suspension = { until: days === null ? null : new Date(Date.now() + days * 86400000), reason };
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateBeforeSave: false });
    await createAuditLog(req, 'suspend_learner', 'User', user._id, { days, reason });
    sendSuccess(res, user, 'Learner suspended');
  } catch (err) { next(err); }
};

exports.getModerationReports = async (req, res, next) => {
  try {
    const reports = await AIInteraction.find({ moderationFlag: { $ne: null } })
      .sort('-createdAt').limit(200)
      .populate('userId', 'firstName lastName email')
      .select('userId prompt moderationFlag createdAt').lean();
    sendSuccess(res, reports, 'Moderation reports retrieved');
  } catch (err) { next(err); }
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
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 29);
    const [completedSessions, duration, skillDistribution, sessionTrend] = await Promise.all([
      PracticeSession.countDocuments({ status: 'completed' }),
      PracticeSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, averageDuration: { $avg: '$duration' }, averageAccuracy: { $avg: '$accuracy' } } }]),
      PracticeSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$skill', sessions: { $sum: 1 }, averageAccuracy: { $avg: '$accuracy' } } }, { $sort: { sessions: -1 } }]),
      PracticeSession.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    const reports = {
      completedSessions: completedSessions.length,
      averagePracticeDuration: Math.round(duration[0]?.averageDuration || 0),
      averageAccuracy: Math.round(duration[0]?.averageAccuracy || 0),
      skillDistribution,
      sessionTrend
    };
    sendSuccess(res, reports, 'Reports retrieved');
  } catch (err) {
    next(err);
  }
};
