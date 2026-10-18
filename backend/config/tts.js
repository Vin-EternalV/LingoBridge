// Settings for the Listening audio that the server generates with Gemini text-to-speech.
// Everything can be changed from backend/.env without touching the code.
const RATES = [8000, 16000, 24000];

module.exports = {
  // Audio is generated only when a Gemini key exists. Set TTS_ENABLED=false to switch it off
  // (the app then falls back to the voice built into the phone or browser).
  enabled: () => process.env.TTS_ENABLED !== 'false' && !!process.env.GEMINI_API_KEY,

  // gemini-3.8-flash-tts = best quality. gemini-3.8-flash-lite-tts = faster and cheaper.
  model: () => process.env.TTS_MODEL || 'gemini-3.8-flash-tts',
  voiceA: () => process.env.TTS_VOICE_A || 'Kore',
  voiceB: () => process.env.TTS_VOICE_B || 'Puck',
  // 16 kHz is plenty for speech and keeps files small (about 2 MB per minute).
  sampleRate: () => (RATES.includes(Number(process.env.TTS_SAMPLE_RATE)) ? Number(process.env.TTS_SAMPLE_RATE) : 16000),

  style: 'clear, natural, steady pace',
  maxCharsPerRequest: 1800,
  requestTimeoutMs: 120000,
  maxParallelJobs: 2,
  staleAfterMs: 5 * 60 * 1000, // a "pending" audio older than this is treated as failed
  keepFilesMs: 24 * 60 * 60 * 1000, // unused audio files are removed after a day
};
