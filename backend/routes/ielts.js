const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const {
  getPrompt,
  submitEssay,
  listSubmissions,
  getStats,
  getSubmission,
  deleteSubmission,
} = require('../controllers/ieltsWritingController');
const speaking = require('../controllers/ieltsSpeakingController');
const reading = require('../controllers/ieltsReadingController');
const listening = require('../controllers/ieltsListeningController');
const mock = require('../controllers/ieltsMockController');
const progress = require('../controllers/ieltsProgressController');
const LearningProfile = require('../models/LearningProfile');
const { requireIeltsEligibility } = require('../middleware/ieltsEligibility');

const router = express.Router();

// A short-lived signed URL is used for the audio stream, so this route is checked before auth middleware.
router.get('/listening/audio/:id', listening.streamAudio);

router.use(protect);
router.use(async (req, res, next) => {
  try {
    req.learningProfile = await LearningProfile.findOne({ userId: req.user.id }).select('currentEnglishLevel englishLevel identityVerification.status');
    next();
  } catch (error) { next(error); }
});
router.use(requireIeltsEligibility);

// AI calls cost money, so each learner gets a fair hourly allowance.
const perUser = (max, message) =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user ? String(req.user._id) : ipKeyGenerator(req.ip)),
    message: { success: false, message },
  });

router.post('/writing/prompt', perUser(30, 'You have asked for a lot of tasks this hour. Please try again later.'), getPrompt);
router.post('/writing/submit', perUser(20, 'You have submitted a lot of essays this hour. Please try again later.'), submitEssay);
router.get('/writing/submissions', listSubmissions);
router.get('/writing/stats', getStats);
router.get('/writing/submissions/:id', getSubmission);
router.delete('/writing/submissions/:id', deleteSubmission);

router.post('/speaking/set', perUser(30, 'You have asked for a lot of question sets this hour. Please try again later.'), speaking.getSet);
router.post('/speaking/submit', perUser(20, 'You have submitted a lot of answers this hour. Please try again later.'), speaking.submitAnswers);
router.get('/speaking/submissions', speaking.listSubmissions);
router.get('/speaking/stats', speaking.getStats);
router.get('/speaking/submissions/:id', speaking.getSubmission);
router.delete('/speaking/submissions/:id', speaking.deleteSubmission);

router.post('/reading/start', perUser(30, 'You have started a lot of reading tests this hour. Please try again later.'), reading.startTest);
router.post('/reading/tests/:id/submit', perUser(60, 'Too many submissions this hour. Please try again later.'), reading.submitTest);
router.get('/reading/tests', reading.listTests);
router.get('/reading/stats', reading.getStats);
router.get('/reading/tests/:id', reading.getTest);
router.delete('/reading/tests/:id', reading.deleteTest);

router.post('/listening/start', perUser(30, 'You have started a lot of listening tests this hour. Please try again later.'), listening.startTest);
router.post('/listening/tests/:id/submit', perUser(60, 'Too many submissions this hour. Please try again later.'), listening.submitTest);
router.get('/listening/tests', listening.listTests);
router.get('/listening/stats', listening.getStats);
router.get('/listening/tests/:id/audio-info', listening.getAudioInfo);
router.get('/listening/tests/:id', listening.getTest);
router.delete('/listening/tests/:id', listening.deleteTest);

router.post('/mock/start', perUser(10, 'You have started a lot of mock tests this hour. Please try again later.'), mock.startMock);
router.get('/mock/:id', mock.getMock);
router.delete('/mock/:id', mock.deleteMock);

router.get('/progress', progress.getProgress);
router.put('/target', progress.setTarget);

module.exports = router;
