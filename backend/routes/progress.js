const express = require('express');
const {
  getProgress,
  getHistory,
  getSessionDetail
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getProgress);
router.get('/history', getHistory);
router.get('/history/:sessionId', getSessionDetail);

module.exports = router;
