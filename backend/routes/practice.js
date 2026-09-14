const express = require('express');
const {
  generateExercises,
  submitAnswer,
  createSession,
  updateSession,
  getSessions,
  getSessionById
} = require('../controllers/practiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/generate', generateExercises);
router.post('/submit', submitAnswer);
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionById);

module.exports = router;
