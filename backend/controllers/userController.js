const User = require('../models/User');
const LearningProfile = require('../models/LearningProfile');
const { sendSuccess, sendError } = require('../utils/responseHelper');

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

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, avatar },
      { new: true, runValidators: true }
    );
    
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.updateOnboarding = async (req, res, next) => {
  try {
    const { englishLevel, learningGoals, preferredAreas, areasOfDifficulty } = req.body;
    
    const profile = await LearningProfile.findOneAndUpdate(
      { userId: req.user.id },
      { 
        englishLevel, 
        learningGoals, 
        preferredAreas, 
        areasOfDifficulty, 
        onboardingComplete: true 
      },
      { new: true, runValidators: true }
    );
    
    sendSuccess(res, profile, 'Onboarding completed');
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    // Basic settings update logic here, depending on model requirements
    sendSuccess(res, null, 'Settings updated');
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
      return sendError(res, 'Incorrect current password', 401);
    }
    
    user.password = newPassword;
    await user.save();
    
    sendSuccess(res, null, 'Password updated');
  } catch (err) {
    next(err);
  }
};
