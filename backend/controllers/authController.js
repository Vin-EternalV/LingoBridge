const crypto = require('crypto');
const User = require('../models/User');
const LearningProfile = require('../models/LearningProfile');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  sendSuccess(res, { token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, avatar: user.avatar } }, 'Success', statusCode);
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already in use', 400);
    }
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });
    
    await LearningProfile.create({
      userId: user._id
    });
    
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return sendError(res, 'Invalid credentials', 401);
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }
    
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await LearningProfile.findOne({ userId: req.user.id });
    
    sendSuccess(res, { user, profile }, 'Current user data');
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return sendError(res, 'There is no user with that email', 404);
    }
    
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });
    
    // Simulating sending email
    console.log(`Reset code for MVP: ${resetToken}`);
    
    sendSuccess(res, null, 'Email sent');
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return sendError(res, 'Invalid or expired token', 400);
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
