const express = require('express');
const {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getAIActivityStats,
  getReports,
  suspendLearner,
  getModerationReports,
  getIdentityVerifications,
  reviewIdentityVerification,
  getIdentityDocument,
} = require('../controllers/adminController');
const {
  getSupportTickets,
  updateSupportTicket,
  getSupportNotifications,
  markSupportNotificationSeen,
  markIdentityVerificationNotificationSeen,
  markModerationNotificationSeen
} = require('../controllers/adminSupportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/suspension', suspendLearner);
router.get('/identity-verifications', getIdentityVerifications);
router.post('/identity-verifications/:id/seen', markIdentityVerificationNotificationSeen);
router.get('/users/:id/identity-document', getIdentityDocument);
router.put('/users/:id/identity-verification', reviewIdentityVerification);

router.get('/content', getContent);
router.post('/content', createContent);
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

router.get('/ai-activity', getAIActivityStats);
router.get('/reports', getReports);
router.get('/moderation-reports', getModerationReports);

router.get('/support', getSupportTickets);
router.get('/support/notifications', getSupportNotifications);
router.post('/support/:id/seen', markSupportNotificationSeen);
router.post('/moderation-reports/:id/seen', markModerationNotificationSeen);
router.put('/support/:id', updateSupportTicket);

module.exports = router;
