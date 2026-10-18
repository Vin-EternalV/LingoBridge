const express = require('express');
const {
  generateExercises,
  submitAnswer,
  createSession,
  updateSession,
  getSessions,
  getSessionById,
  getLearningContent,
  answerSession,
} = require('../controllers/practiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/generate', generateExercises);
router.get('/content', getLearningContent);
router.post('/submit', submitAnswer);
router.post('/sessions', createSession);
router.post('/sessions/:id/answer', answerSession);
router.put('/sessions/:id', updateSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionById);

module.exports = router;
