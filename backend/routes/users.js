const express = require('express');
const {
  getProfile,
  updateProfile,
  updateOnboarding,
  updateLearningProfile,
  updateGoals,
  getGoalsProgress,
  updateSettings,
  updatePassword,
  deleteAccount,
  logoutAllDevices,
  exportData,
  clearAiHistory,
  clearPracticeHistory,
  markGuideSeen,
  getLearningProgress,
  requestIdentityVerification,
  uploadIdentityDocument,
  getVerificationStatus,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const {
  validate,
  profileUpdateValidation,
  accountUpdateValidation,
  onboardingValidation,
  learningProfileValidation,
  goalsValidation,
  settingsValidation,
  passwordValidation
} = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate([...profileUpdateValidation, ...accountUpdateValidation]), updateProfile);
router.put('/onboarding', validate(onboardingValidation), updateOnboarding);
router.put('/learning-profile', validate(learningProfileValidation), updateLearningProfile);
router.put('/goals', validate(goalsValidation), updateGoals);
router.get('/goals-progress', getGoalsProgress);
router.put('/settings', validate(settingsValidation), updateSettings);
router.put('/password', validate(passwordValidation), updatePassword);
router.put('/guide-seen', markGuideSeen);
router.get('/learning-progress', getLearningProgress);
router.get('/identity-verification', getVerificationStatus);
router.post('/identity-verification/document', uploadIdentityDocument);
router.post('/identity-verification', requestIdentityVerification);
router.post('/logout-all', logoutAllDevices);
router.get('/export', exportData);
router.delete('/me/ai-history', clearAiHistory);
router.delete('/me/practice-history', clearPracticeHistory);
router.delete('/me', deleteAccount);

module.exports = router;
