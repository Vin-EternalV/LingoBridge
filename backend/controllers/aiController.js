const aiService = require('../services/aiService');
const AIInteraction = require('../models/AIInteraction');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.chat = async (req, res, next) => {
  try {
    const { message, chatHistory, learnerLevel } = req.body;
    
    const response = await aiService.chatAssistant({ messages: [{ role: 'user', content: message }, ...(chatHistory || [])], learnerLevel, userProfile: req.user });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'assistant_chat',
      prompt: message,
      response,
      success: true
    });
    
    sendSuccess(res, { response }, 'Chat response generated');
  } catch (err) {
    await AIInteraction.create({
      userId: req.user.id,
      type: 'assistant_chat',
      success: false,
      errorMessage: err.message
    });
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { learnerLevel, areasOfDifficulty } = req.query;
    
    // Simulating generating personalized topic/skill practice suggestions
    const suggestions = [
      { skill: 'grammar', topic: 'Present Perfect Tense', reason: 'You had difficulty here recently.' },
      { skill: 'vocabulary', topic: 'Business English', reason: 'Matches your preferred areas.' }
    ];
    
    sendSuccess(res, suggestions, 'Suggestions retrieved');
  } catch (err) {
    next(err);
  }
};
