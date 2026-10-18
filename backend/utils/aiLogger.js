const AIInteraction = require('../models/AIInteraction');

// Records an AI request. If the learner turned off "Save my AI conversations", the request is
// still counted (so admin statistics keep working) but prompt and response text are dropped.
// Logging problems never break the request that triggered them.
exports.logAIInteraction = async (user, fields) => {
  try {
    const keepText = user?.settings?.privacy?.saveAiHistory !== false;
    const entry = { userId: user._id || user.id, ...fields };
    if (!keepText) {
      delete entry.prompt;
      delete entry.response;
    }
    await AIInteraction.create(entry);
  } catch (err) {
    console.warn(`Could not log AI interaction: ${err.message}`);
  }
};
