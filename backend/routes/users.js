const express = require('express');
const {
  getProfile,
  updateProfile,
  updateOnboarding,
  updateSettings,
  updatePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, profileUpdateValidation, onboardingValidation } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(profileUpdateValidation), updateProfile);
router.put('/onboarding', validate(onboardingValidation), updateOnboarding);
router.put('/settings', updateSettings);
router.put('/password', updatePassword);

module.exports = router;
