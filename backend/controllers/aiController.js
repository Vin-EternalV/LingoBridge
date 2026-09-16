const aiService = require('../services/aiService');
const AIInteraction = require('../models/AIInteraction');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.chat = async (req, res, next) => {
  try {
    const { message, chatHistory, learnerLevel } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length > 1000) {
      return sendError(res, 'A message up to 1,000 characters is required.', 400);
    }
    
    const { data, tokensUsed } = await aiService.chatAssistant({ messages: [...(chatHistory || []), { role: 'user', content: message }], learnerLevel });
    
    await AIInteraction.create({
      userId: req.user.id,
      type: 'assistant_chat',
      prompt: message,
      response: data,
      tokensUsed,
      success: true
    });
    
    sendSuccess(res, data, 'Chat response generated');
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
