const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const PracticeSession = require('../models/PracticeSession');
const mongoose = require('mongoose');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { ROLES } = require('../config/constants');

exports.getSuperAdminDashboard = async (req, res, next) => {
  try {
    const [adminCount, logCount, totalUsers, activeLearners] = await Promise.all([
      User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } }), AuditLog.countDocuments(), User.countDocuments(), User.countDocuments({ role: ROLES.LEARNER, isActive: true })
    ]);
    sendSuccess(res, { totalUsers, totalAdmins: adminCount, activeLearners, logCount }, 'SuperAdmin Dashboard stats');
  } catch (err) {
    next(err);
  }
};

exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } }).sort('-createdAt');
    sendSuccess(res, admins, 'Admins retrieved');
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    if (role !== ROLES.ADMIN && role !== ROLES.SUPERADMIN) {
      return sendError(res, 'Invalid role', 400);
    }
    
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already in use', 400);
    
    const admin = await User.create({ firstName, lastName, email, password, role });
    
    sendSuccess(res, { id: admin._id, email: admin.email, role: admin.role }, 'Admin created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateAdminStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN) {
      return sendError(res, 'User is not an admin', 400);
    }
    
    user.isActive = !user.isActive;
    await user.save();
    sendSuccess(res, user, `Admin status updated to ${user.isActive}`);
  } catch (err) {
    next(err);
  }
};

exports.getRolesAndPermissions = async (req, res, next) => {
  try {
    const matrix = {
      learner: ['read_content', 'take_practice'],
      admin: ['manage_users', 'manage_content', 'view_reports'],
      superadmin: ['manage_users', 'manage_content', 'view_reports', 'manage_admins', 'view_system_logs']
    };
    sendSuccess(res, matrix, 'Roles and permissions retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));
    const [totalUsers, activeUsersWeekly, completedSessions, accuracy, roleCounts, sessionTrend, userTrend] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7 * 86400000) }, isActive: true }),
      PracticeSession.countDocuments({ status: 'completed' }),
      PracticeSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, average: { $avg: '$accuracy' } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      PracticeSession.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    const analytics = {
      totalUsers,
      activeUsersWeekly,
      completedSessions,
      averageAccuracy: Math.round(accuracy[0]?.average || 0),
      days,
      roleCounts: Object.fromEntries(roleCounts.map(({ _id, count }) => [_id, count])),
      sessionTrend,
      userTrend
    };
    sendSuccess(res, analytics, 'Platform analytics retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getSystemMonitoring = async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const system = {
      uptime: process.uptime(),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external
      },
      dbState: mongoose.connection.readyState
    };
    sendSuccess(res, system, 'System monitoring stats retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    let query = {};
    if (req.query.action) query.action = req.query.action;
    
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort('-createdAt').skip(startIndex).limit(limit);
    
    sendPaginated(res, logs, page, limit, total);
  } catch (err) {
    next(err);
  }
};
