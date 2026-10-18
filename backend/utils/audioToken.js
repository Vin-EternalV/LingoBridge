const jwt = require('jsonwebtoken');

// A short-lived link token so the audio player can fetch the file without a login header.
// It is signed with a different secret than login tokens, so it can never be used to call the API.
const secret = () => `${process.env.JWT_SECRET}:listening-audio`;

exports.signAudioToken = (testId, userId) => jwt.sign({ tid: String(testId), uid: String(userId) }, secret(), { expiresIn: '2h' });

exports.verifyAudioToken = (token) => {
  try {
    const payload = jwt.verify(String(token || ''), secret());
    return payload && payload.tid && payload.uid ? payload : null;
  } catch (e) {
    return null;
  }
};
