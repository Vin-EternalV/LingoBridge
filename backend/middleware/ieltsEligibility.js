const { ageOnDate } = require('../utils/learningProgression');

const requireIeltsEligibility = (req, res, next) => {
  const age = ageOnDate(req.user?.dateOfBirth);
  const profile = req.learningProfile;
  const currentLevel = profile?.currentEnglishLevel || profile?.englishLevel;
  if (age === null || age < 18) {
    return res.status(403).json({ success: false, message: 'IELTS preparation is available only to users aged 18 and above.' });
  }
  if (currentLevel !== 'advanced') {
    return res.status(403).json({ success: false, message: 'Reach Advanced English to unlock IELTS preparation.' });
  }
  if (profile?.identityVerification?.status !== 'verified') {
    return res.status(403).json({ success: false, message: 'Verify your age and identity to access IELTS preparation.' });
  }
  return next();
};

module.exports = { requireIeltsEligibility };
