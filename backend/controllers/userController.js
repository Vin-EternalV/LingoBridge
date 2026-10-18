const User = require('../models/User');
const LearningProfile = require('../models/LearningProfile');
const Progress = require('../models/Progress');
const PracticeSession = require('../models/PracticeSession');
const AIInteraction = require('../models/AIInteraction');
const SurveyResponse = require('../models/SurveyResponse');
const SupportTicket = require('../models/SupportTicket');
const WritingSubmission = require('../models/WritingSubmission');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const ReadingTest = require('../models/ReadingTest');
const ListeningTest = require('../models/ListeningTest');
const MockTest = require('../models/MockTest');
const IeltsProfile = require('../models/IeltsProfile');
const Otp = require('../models/Otp');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const audioStore = require('../services/audioStore');
const { progressionView, ageOnDate } = require('../utils/learningProgression');
const { saveDocument, removeDocument } = require('../utils/identityDocuments');

// Existing sessions saved before the duration fix may hold inflated values,
// so each session contributes at most this many minutes to goal progress.
const MAX_MINUTES_PER_SESSION = 180;

// Profile photos are small square JPEG/PNG/WebP data URLs (the app sends 256x256, about 15-40 KB).
const MAX_AVATAR_LENGTH = 400000;
const { findLanguage } = require('../config/languages');

const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await LearningProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    sendSuccess(res, { user, profile }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};

// Account Settings: name and email. Changing email requires the current password.
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar, nativeLanguage, email, currentPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (avatar !== undefined) {
      if (!avatar) {
        user.avatar = undefined; // empty value removes the photo
      } else if (typeof avatar !== 'string' || avatar.length > MAX_AVATAR_LENGTH || !AVATAR_PATTERN.test(avatar)) {
        return sendError(res, 'Profile photo must be a JPEG, PNG or WebP image under 300 KB.', 400);
      } else {
        user.avatar = avatar;
      }
    }

    if (nativeLanguage !== undefined) {
      const value = typeof nativeLanguage === 'string' ? nativeLanguage.trim() : null;
      // Only real languages from the list are accepted; an empty value clears the setting.
      const language = value ? findLanguage(value) : null;
      if (value === null || (value && !language)) {
        return sendError(res, 'Please choose your native language from the list.', 400);
      }
      user.nativeLanguage = language || undefined;
    }

    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      if (!currentPassword) {
        return sendError(res, 'Enter your current password to change your email', 400);
      }
      if (!(await user.matchPassword(currentPassword))) {
        return sendError(res, 'Incorrect current password', 400);
      }
      const taken = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (taken) {
        return sendError(res, 'Email already in use', 400);
      }
      user.email = email;
    }

    await user.save();
    user.password = undefined;

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.updateOnboarding = async (req, res, next) => {
  try {
    const { englishLevel, learningGoals, preferredAreas, areasOfDifficulty } = req.body;
    const profile = await LearningProfile.findOne({ userId: req.user.id });
    if (!profile) return sendError(res, 'Learning profile not found', 404);
    if (profile.onboardingComplete) {
      if ((profile.startingEnglishLevel || profile.englishLevel) === englishLevel) {
        return sendSuccess(res, profile, 'Onboarding already completed');
      }
      return sendError(res, 'Your starting English level is locked after setup.', 409);
    }
    profile.englishLevel = englishLevel;
    profile.startingEnglishLevel = englishLevel;
    profile.currentEnglishLevel = englishLevel;
    profile.learningGoals = learningGoals;
    profile.preferredAreas = preferredAreas;
    profile.areasOfDifficulty = areasOfDifficulty;
    profile.onboardingComplete = true;
    await profile.save();

    sendSuccess(res, profile, 'Onboarding completed');
  } catch (err) {
    next(err);
  }
};

// Learning Profile: edit level, goals, preferred areas and difficulties after onboarding.
exports.updateLearningProfile = async (req, res, next) => {
  try {
    const update = {};
    ['learningGoals', 'preferredAreas', 'areasOfDifficulty'].forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    if (req.body.englishLevel !== undefined) return sendError(res, 'Your English level is locked. Complete sessions to advance.', 403);

    const profile = await LearningProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    sendSuccess(res, profile, 'Learning profile updated');
  } catch (err) {
    next(err);
  }
};

exports.getLearningProgress = async (req, res, next) => {
  try {
    const profile = await LearningProfile.findOne({ userId: req.user.id });
    const age = ageOnDate(req.user.dateOfBirth);
    const isAdvanced = (profile?.currentEnglishLevel || profile?.englishLevel) === 'advanced';
    const eligibleByAge = age !== null && age >= 18;
    const verification = profile?.identityVerification?.status || 'not_requested';
    sendSuccess(res, {
      ...progressionView(profile),
      ageEligible: eligibleByAge,
      verificationStatus: verification,
      ieltsAccess: isAdvanced && eligibleByAge && verification === 'verified',
      ieltsLockReason: !isAdvanced ? 'level' : !eligibleByAge ? 'age' : verification !== 'verified' ? 'verification' : null,
    }, 'Learning progression retrieved');
  } catch (err) { next(err); }
};

exports.getVerificationStatus = async (req, res, next) => {
  try {
    const profile = await LearningProfile.findOne({ userId: req.user.id })
      .select('currentEnglishLevel englishLevel identityVerification.status identityVerification.requestedAt identityVerification.documentUploadedAt +identityVerification.documentKey');
    const age = ageOnDate(req.user.dateOfBirth);
    sendSuccess(res, {
      status: profile?.identityVerification?.status || 'not_requested',
      requestedAt: profile?.identityVerification?.requestedAt || null,
      hasIdDocument: Boolean(profile?.identityVerification?.documentKey),
      documentUploadedAt: profile?.identityVerification?.documentUploadedAt || null,
      ageEligible: age !== null && age >= 18,
      levelEligible: (profile?.currentEnglishLevel || profile?.englishLevel) === 'advanced',
    }, 'Verification status retrieved');
  } catch (err) { next(err); }
};

exports.uploadIdentityDocument = async (req, res, next) => {
  let savedDocument;
  try {
    const age = ageOnDate(req.user.dateOfBirth);
    if (age === null || age < 18) return sendError(res, 'Identity verification for IELTS is available only to users aged 18 and above.', 403);
    const profile = await LearningProfile.findOne({ userId: req.user.id })
      .select('+identityVerification.documentKey +identityVerification.documentMimeType');
    if (!profile || (profile.currentEnglishLevel || profile.englishLevel) !== 'advanced') {
      return sendError(res, 'Reach Advanced English before uploading an ID for IELTS verification.', 403);
    }
    if (profile.identityVerification?.status === 'verified') return sendError(res, 'Your identity is already verified.', 409);
    let parsed;
    try { parsed = await saveDocument(req.body || {}); }
    catch (error) { return sendError(res, error.message, 400); }
    savedDocument = parsed;
    const oldKey = profile.identityVerification?.documentKey;
    const oldMimeType = profile.identityVerification?.documentMimeType;
    profile.set('identityVerification.documentKey', parsed.key);
    profile.set('identityVerification.documentMimeType', parsed.mimeType);
    profile.set('identityVerification.documentUploadedAt', new Date());
    await profile.save();
    if (oldKey && oldKey !== parsed.key) await removeDocument(oldKey, oldMimeType).catch(() => {});
    sendSuccess(res, { hasIdDocument: true, documentUploadedAt: profile.identityVerification.documentUploadedAt }, 'Government ID image uploaded securely. Submit the verification request when ready.');
  } catch (err) {
    if (savedDocument) await removeDocument(savedDocument.key, savedDocument.mimeType).catch(() => {});
    next(err);
  }
};

exports.requestIdentityVerification = async (req, res, next) => {
  try {
    const age = ageOnDate(req.user.dateOfBirth);
    if (age === null || age < 18) return sendError(res, 'Identity verification for IELTS is available only to users aged 18 and above.', 403);
    const profile = await LearningProfile.findOne({ userId: req.user.id }).select('+identityVerification.documentKey');
    if (!profile || (profile.currentEnglishLevel || profile.englishLevel) !== 'advanced') {
      return sendError(res, 'Reach Advanced English before requesting IELTS verification.', 403);
    }
    if (profile.identityVerification?.status === 'verified') return sendError(res, 'Your identity is already verified.', 409);
    if (!profile.identityVerification?.documentKey) return sendError(res, 'Upload an image of your government-issued ID before submitting your verification request.', 400);
    profile.set('identityVerification.status', 'pending');
    profile.set('identityVerification.requestedAt', new Date());
    profile.set('identityVerification.reviewedAt', undefined);
    profile.set('identityVerification.adminSeenAt', undefined);
    await profile.save();
    sendSuccess(res, { status: 'pending' }, 'Verification request received. Follow the secure verification instructions from support.');
  } catch (err) { next(err); }
};

// Goals & Progress: save daily / weekly targets.
exports.updateGoals = async (req, res, next) => {
  try {
    const update = {};
    if (req.body.dailyGoalMinutes !== undefined) update.dailyGoalMinutes = Number(req.body.dailyGoalMinutes);
    if (req.body.weeklyGoalSessions !== undefined) update.weeklyGoalSessions = Number(req.body.weeklyGoalSessions);

    const profile = await LearningProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    sendSuccess(res, profile, 'Goals updated');
  } catch (err) {
    next(err);
  }
};

// Goals & Progress: today's minutes, last-7-days sessions and a per-day breakdown.
// The client sends its timezone offset (minutes, as from Date#getTimezoneOffset)
// so "today" matches the learner's own day rather than the server's.
exports.getGoalsProgress = async (req, res, next) => {
  try {
    const tzOffset = parseInt(req.query.tzOffset, 10) || 0;
    const toLocalKey = (date) => new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push({ date: toLocalKey(d), minutes: 0, sessions: 0 });
    }
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));

    const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const sessions = await PracticeSession.find({
      userId: req.user.id,
      status: 'completed',
      createdAt: { $gte: since }
    }).select('duration createdAt completedAt');

    sessions.forEach((session) => {
      const key = toLocalKey(session.completedAt || session.createdAt);
      if (byDate[key]) {
        byDate[key].sessions += 1;
        byDate[key].minutes += Math.min(session.duration || 0, MAX_MINUTES_PER_SESSION);
      }
    });

    const profile = await LearningProfile.findOne({ userId: req.user.id });
    const progress = await Progress.findOne({ userId: req.user.id });

    // The stored streak only updates when a session is completed, so a lapsed streak must read 0.
    const dayNumber = (date) => Math.floor((date.getTime() - tzOffset * 60000) / 86400000);
    const lastPractice = progress?.streak?.lastPracticeDate;
    const streakAlive = !!lastPractice && dayNumber(new Date()) - dayNumber(new Date(lastPractice)) <= 1;

    sendSuccess(res, {
      dailyGoalMinutes: profile?.dailyGoalMinutes ?? 15,
      weeklyGoalSessions: profile?.weeklyGoalSessions ?? 5,
      todayMinutes: days[days.length - 1].minutes,
      weekSessions: days.reduce((sum, d) => sum + d.sessions, 0),
      streak: {
        current: streakAlive ? progress.streak.current || 0 : 0,
        longest: progress?.streak?.longest || 0
      },
      days
    }, 'Goals progress retrieved');
  } catch (err) {
    next(err);
  }
};

// Notifications and privacy: only whitelisted keys are ever written.
exports.updateSettings = async (req, res, next) => {
  try {
    const notifications = req.body.notifications || {};
    const privacy = req.body.privacy || {};
    const update = {};
    ['dailyReminder', 'weeklyReminder', 'reminderTime'].forEach((key) => {
      if (notifications[key] !== undefined) update[`settings.notifications.${key}`] = notifications[key];
    });
    if (privacy.saveAiHistory !== undefined) {
      update['settings.privacy.saveAiHistory'] = privacy.saveAiHistory === true || privacy.saveAiHistory === 'true';
    }

    if (Object.keys(update).length === 0) {
      return sendSuccess(res, req.user.settings, 'Settings unchanged');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    sendSuccess(res, user.settings, 'Settings updated');
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Incorrect current password', 400);
    }

    if (currentPassword === newPassword) {
      return sendError(res, 'New password must be different from the current one', 400);
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // signs out every other device
    await user.save();

    sendSuccess(res, { token: user.getSignedJwtToken() }, 'Password updated');
  } catch (err) {
    next(err);
  }
};

// Account Settings: permanently delete the learner's account and their data.
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (user.role !== 'learner') {
      return sendError(res, 'Only learner accounts can be deleted from the app', 403);
    }

    const { password } = req.body;
    if (!password || !(await user.matchPassword(password))) {
      return sendError(res, 'Incorrect password', 400);
    }

    const userId = user._id;
    const learningProfile = await LearningProfile.findOne({ userId })
      .select('+identityVerification.documentKey +identityVerification.documentMimeType');
    const listeningIds = (await ListeningTest.find({ userId }).select('_id')).map((test) => test._id);
    if (learningProfile?.identityVerification?.documentKey) {
      await removeDocument(learningProfile.identityVerification.documentKey, learningProfile.identityVerification.documentMimeType);
    }
    await Promise.all([
      LearningProfile.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      PracticeSession.deleteMany({ userId }),
      AIInteraction.deleteMany({ userId }),
      SurveyResponse.deleteMany({ userId }),
      SupportTicket.deleteMany({ userId }),
      WritingSubmission.deleteMany({ userId }),
      SpeakingSubmission.deleteMany({ userId }),
      ReadingTest.deleteMany({ userId }),
      ListeningTest.deleteMany({ userId }),
      MockTest.deleteMany({ userId }),
      IeltsProfile.deleteMany({ userId }),
      Otp.deleteMany({ userId })
    ]);
    await audioStore.removeMany(listeningIds);
    await User.deleteOne({ _id: userId });

    sendSuccess(res, null, 'Account deleted');
  } catch (err) {
    next(err);
  }
};

// Remember that the learner has completed or skipped the first-run guide.
exports.markGuideSeen = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { guideSeenAt: new Date() }, { new: true });
    sendSuccess(res, { guideSeenAt: user.guideSeenAt }, 'Guide marked as seen');
  } catch (err) {
    next(err);
  }
};

// Privacy & Security: sign out every device. This device gets a fresh token so it stays signed in.
exports.logoutAllDevices = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } }, { new: true });
    sendSuccess(res, { token: user.getSignedJwtToken() }, 'Signed out of all other devices');
  } catch (err) {
    next(err);
  }
};

// Privacy & Security: everything we hold about the learner, as one JSON document.
exports.exportData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [account, learningProfile, progress, practiceSessions, aiConversations, surveyResponses, supportRequests,
      ieltsWriting, ieltsSpeaking, ieltsReading, ieltsListening, ieltsMockTests, ieltsProfile] =
      await Promise.all([
        User.findById(userId).select('-tokenVersion -__v').lean(),
        LearningProfile.findOne({ userId }).select('-__v').lean(),
        Progress.findOne({ userId }).select('-__v').lean(),
        PracticeSession.find({ userId }).sort('createdAt').select('-__v').lean(),
        AIInteraction.find({ userId }).sort('createdAt').select('-__v').lean(),
        SurveyResponse.find({ userId }).sort('createdAt').select('-__v').lean(),
        SupportTicket.find({ userId }).sort('createdAt').select('-__v').lean(),
        WritingSubmission.find({ userId }).sort('createdAt').select('-__v').lean(),
        SpeakingSubmission.find({ userId }).sort('createdAt').select('-__v').lean(),
        ReadingTest.find({ userId }).sort('createdAt').select('-__v').lean(),
        ListeningTest.find({ userId }).sort('createdAt').select('-__v').lean(),
        MockTest.find({ userId }).sort('createdAt').select('-__v').lean(),
        IeltsProfile.findOne({ userId }).select('-__v').lean()
      ]);

    sendSuccess(res, {
      exportedAt: new Date().toISOString(),
      account,
      learningProfile,
      progress,
      practiceSessions,
      aiConversations,
      surveyResponses,
      supportRequests,
      ielts: { writing: ieltsWriting, speaking: ieltsSpeaking, reading: ieltsReading, listening: ieltsListening, mockTests: ieltsMockTests, profile: ieltsProfile }
    }, 'Data export ready');
  } catch (err) {
    next(err);
  }
};

// Privacy & Security: remove the text of past AI conversations. The requests themselves stay
// as anonymous counts, so platform statistics do not change.
exports.clearAiHistory = async (req, res, next) => {
  try {
    const result = await AIInteraction.updateMany(
      { userId: req.user.id },
      { $unset: { prompt: 1, response: 1 } }
    );
    sendSuccess(res, { cleared: result.modifiedCount }, 'AI conversation history cleared');
  } catch (err) {
    next(err);
  }
};

// Privacy & Security: delete saved practice sessions (questions and answers). Progress totals,
// accuracy and streaks are kept.
exports.clearPracticeHistory = async (req, res, next) => {
  try {
    const result = await PracticeSession.deleteMany({ userId: req.user.id });
    sendSuccess(res, { deleted: result.deletedCount }, 'Practice history deleted');
  } catch (err) {
    next(err);
  }
};
