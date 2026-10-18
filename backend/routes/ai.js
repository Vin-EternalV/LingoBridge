const express = require('express');
const {
  chat,
  getChatHistory,
  getSuggestions
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/history', getChatHistory);
router.post('/chat', chat);
router.get('/suggestions', getSuggestions);

module.exports = router;
