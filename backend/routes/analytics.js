const express = require('express');
const { surveySummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN, ROLES.SUPERADMIN));
router.get('/survey-summary', surveySummary);

module.exports = router;
