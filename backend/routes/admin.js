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
  getReports
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

router.get('/content', getContent);
router.post('/content', createContent);
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

router.get('/ai-activity', getAIActivityStats);
router.get('/reports', getReports);

module.exports = router;
