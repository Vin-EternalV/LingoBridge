const express = require('express');
const {
  chat,
  getSuggestions
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/chat', chat);
router.get('/suggestions', getSuggestions);

module.exports = router;
