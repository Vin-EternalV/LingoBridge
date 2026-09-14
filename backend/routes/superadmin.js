const express = require('express');
const {
  getSuperAdminDashboard,
  getAdmins,
  createAdmin,
  updateAdminStatus,
  getRolesAndPermissions,
  getPlatformAnalytics,
  getSystemMonitoring,
  getAuditLogs
} = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.SUPERADMIN));

router.get('/dashboard', getSuperAdminDashboard);
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id/status', updateAdminStatus);
router.get('/roles', getRolesAndPermissions);
router.get('/analytics', getPlatformAnalytics);
router.get('/system', getSystemMonitoring);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
