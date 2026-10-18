const express = require('express');
const { submitSurvey, getMySurvey } = require('../controllers/surveyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', submitSurvey);
router.get('/me', getMySurvey);

module.exports = router;
