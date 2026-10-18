const ListeningTest = require('../models/ListeningTest');
const MockTest = require('../models/MockTest');
const ieltsService = require('../services/ieltsListeningService');
const { attachToMock } = require('./ieltsMockController');
const { logAIInteraction } = require('../utils/aiLogger');
const ttsService = require('../services/ttsService');
const audioStore = require('../services/audioStore');
const ttsConfig = require('../config/tts');
const { signAudioToken, verifyAudioToken } = require('../utils/audioToken');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { LISTENING, TYPE_ORDER, scoreToBand } = require('../config/ieltsListening');
const { normalize, stripArticle } = require('../config/ieltsReading');
const { countWords } = require('../config/ieltsWriting');
const User = require('../models/User');
const LearningProfile = require('../models/LearningProfile');
const { ageOnDate } = require('../utils/learningProgression');

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems, maxLen) =>
  (Array.isArray(value) ? value : []).map((v) => text(v, maxLen)).filter(Boolean).slice(0, maxItems);
const squash = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');
const isId = (id) => /^[a-f\d]{24}$/i.test(String(id || ''));

// Cleans the AI output and drops any question whose answer key can't be trusted.
const buildTest = (data) => {
  const turns = (Array.isArray(data?.turns) ? data.turns : [])
    .map((t) => ({ speaker: t?.speaker === 'B' ? 'B' : 'A', text: text(t?.text, 1500) }))
    .filter((t) => t.text.length >= 5)
    .slice(0, 40);
  const script = squash(turns.map((t) => t.text).join(' '));
  const words = countWords(script);
  if (turns.length < 3 || words < LISTENING.minScriptWords || words > LISTENING.maxScriptWords) return null;

  const matchOptions = [...new Set(list(data?.matchOptions, 6, 120))];
  const matchKey = new Map(matchOptions.map((o) => [normalize(o), o]));
  const usedMatchAnswers = new Set();

  const questions = [];
  for (const raw of Array.isArray(data?.questions) ? data.questions : []) {
    const type = raw?.type;
    const question = text(raw?.question, 500);
    const answerRaw = text(raw?.answer, 200);
    if (!TYPE_ORDER.includes(type) || !question || !answerRaw) continue;

    let evidence = text(raw?.evidence, 500);
    if (evidence && !script.includes(squash(evidence))) evidence = ''; // never show a quote that isn't in the script
    const base = { type, question, explanation: text(raw?.explanation, 400), evidence, options: [], acceptedAnswers: [] };

    if (type === 'completion') {
      const answer = normalize(answerRaw);
      if (!answer || countWords(answer) > 3 || !script.includes(answer) || !question.includes('___')) continue;
      const accepted = list(raw?.acceptedAnswers, 5, 60).map(normalize).filter((a) => a && countWords(a) <= 3);
      questions.push({ ...base, answer: answerRaw, acceptedAnswers: [...new Set(accepted)] });
    } else if (type === 'mcq') {
      const options = list(raw?.options, 3, 300);
      if (options.length !== 3 || new Set(options.map(normalize)).size !== 3) continue;
      const answer = options.find((o) => normalize(o) === normalize(answerRaw));
      if (!answer) continue;
      questions.push({ ...base, options, answer });
    } else if (type === 'matching') {
      const answer = matchKey.get(normalize(answerRaw));
      if (!answer || matchOptions.length < 3 || usedMatchAnswers.has(answer)) continue;
      usedMatchAnswers.add(answer);
      questions.push({ ...base, answer });
    }
  }

  questions.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  const finalQuestions = questions.slice(0, LISTENING.maxQuestions);
  if (finalQuestions.length < LISTENING.minQuestions) return null;

  return {
    title: text(data?.title, 150),
    context: text(data?.context, 400),
    turns,
    matchTitle: finalQuestions.some((q) => q.type === 'matching') ? text(data?.matchTitle, 200) : '',
    matchOptions: finalQuestions.some((q) => q.type === 'matching') ? matchOptions : [],
    questions: finalQuestions,
  };
};

// What the app may see before submitting: the script (the device reads it aloud) but no answers.
const toTakeView = (doc) => ({
  id: doc._id,
  kind: doc.kind,
  title: doc.title,
  context: doc.context,
  turns: doc.turns,
  matchTitle: doc.matchTitle,
  matchOptions: doc.matchOptions,
  questions: doc.questions.map((q, index) => ({ index, type: q.type, question: q.question, options: q.options })),
  prepSeconds: LISTENING.prepSeconds,
  minutes: LISTENING.minutes,
  audioStatus: doc.audioStatus || 'none',
});

const isAnswerCorrect = (q, given) => {
  const g = normalize(given);
  if (!g) return false;
  if (q.type === 'completion') {
    const accepted = [normalize(q.answer), ...(q.acceptedAnswers || []).map(normalize)];
    return accepted.includes(g) || accepted.includes(stripArticle(g)) || accepted.map(stripArticle).includes(g);
  }
  return g === normalize(q.answer);
};

const toResultView = (doc) => ({
  id: doc._id,
  kind: doc.kind,
  title: doc.title,
  context: doc.context,
  transcript: doc.turns,
  matchOptions: doc.matchOptions,
  score: doc.score,
  total: doc.total,
  band: doc.band,
  timeSpentSec: doc.timeSpentSec,
  createdAt: doc.createdAt,
  review: doc.questions.map((q, i) => ({
    index: i,
    type: q.type,
    question: q.question,
    yourAnswer: doc.answers?.[i] || '',
    correctAnswer: q.answer,
    correct: !!doc.correct?.[i],
    explanation: q.explanation,
    evidence: q.evidence,
  })),
});

// ---------- server-made audio ----------
// At most a couple of recordings are made at the same time, the rest wait their turn.
let running = 0;
const waiting = [];
const schedule = (job) => {
  const run = async () => {
    running += 1;
    try {
      await job();
    } finally {
      running -= 1;
      const next = waiting.shift();
      if (next) next();
    }
  };
  if (running < ttsConfig.maxParallelJobs) run();
  else waiting.push(run);
};

// Makes the recording in the background. The learner does not wait for it: the app checks back and
// uses the device voice if it is not ready (or fails).
const startAudioJob = (doc, user) => {
  schedule(async () => {
    try {
      const { wav, seconds } = await ttsService.synthesizeScript({ turns: doc.turns });
      await audioStore.save(doc._id, wav);
      await ListeningTest.updateOne({ _id: doc._id }, { audioStatus: 'ready', audioBytes: wav.length, audioError: '' });
      await logAIInteraction(user, { type: 'listening_audio', skill: 'listening', prompt: `Listening audio (${seconds}s)`, success: true });
    } catch (err) {
      console.warn(`Listening audio failed for ${doc._id}: ${err.message}`);
      await ListeningTest.updateOne({ _id: doc._id }, { audioStatus: 'failed', audioError: String(err.message).slice(0, 200) }).catch(() => {});
      await logAIInteraction(user, { type: 'listening_audio', skill: 'listening', success: false, errorMessage: err.message });
    }
  });
};

// POST /api/ielts/listening/start   { kind?, topic?, mockId? }
exports.startTest = async (req, res, next) => {
  try {
    const kind = LISTENING.kinds.includes(req.body.kind) ? req.body.kind : 'conversation';
    const topic = text(req.body.topic, 80);

    let mock = null;
    if (req.body.mockId) {
      if (!isId(req.body.mockId)) return sendError(res, 'Mock test not found.', 404);
      mock = await MockTest.findOne({ _id: req.body.mockId, userId: req.user._id, status: 'in_progress' });
      const section = mock?.sections.find((s) => s.key === 'listening' && s.status === 'pending');
      if (!section) return sendError(res, 'This mock test has no Listening section waiting.', 400);
    }

    const { data, tokensUsed } = await ieltsService.generateListeningTest({ kind, topic });
    const built = buildTest(data);
    if (!built) return sendError(res, 'The AI could not create a complete listening test. Please try again.', 502);

    const useAudio = ttsConfig.enabled();
    const doc = await ListeningTest.create({
      userId: req.user._id,
      mockId: mock ? mock._id : undefined,
      kind,
      audioStatus: useAudio ? 'pending' : 'none',
      ...built,
    });
    if (useAudio) startAudioJob(doc, req.user);

    if (mock) {
      mock.sections.find((s) => s.key === 'listening').refId = doc._id; // lets the mock hub resume this test
      mock.markModified('sections');
      await mock.save();
    }

    await logAIInteraction(req.user, {
      type: 'listening_prompt',
      skill: 'listening',
      prompt: `IELTS Listening ${kind}${topic ? ` on ${topic}` : ''}`,
      tokensUsed,
      success: true,
    });

    sendSuccess(res, toTakeView(doc), 'Listening test ready', 201);
  } catch (err) {
    await logAIInteraction(req.user, { type: 'listening_prompt', skill: 'listening', success: false, errorMessage: err.message });
    next(err);
  }
};

// GET /api/ielts/listening/tests/:id -> { status: 'ready', test } or { status: 'submitted', result }
exports.getTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Listening test not found', 404);
    const doc = await ListeningTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Listening test not found', 404);
    if (doc.status === 'submitted') return sendSuccess(res, { status: 'submitted', result: toResultView(doc) });
    sendSuccess(res, { status: 'ready', test: toTakeView(doc) });
  } catch (err) {
    next(err);
  }
};

// POST /api/ielts/listening/tests/:id/submit   { answers: [string], timeSpentSec }
exports.submitTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Listening test not found', 404);
    const doc = await ListeningTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Listening test not found', 404);
    if (doc.status === 'submitted') return sendError(res, 'This test has already been submitted.', 400);

    const raw = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (raw.length !== doc.questions.length) return sendError(res, 'Answer sheet does not match the test.', 400);
    const answers = raw.map((a) => (typeof a === 'string' ? a.trim().slice(0, 200) : ''));

    const correct = doc.questions.map((q, i) => isAnswerCorrect(q, answers[i]));
    const score = correct.filter(Boolean).length;

    doc.status = 'submitted';
    doc.answers = answers;
    doc.correct = correct;
    doc.score = score;
    doc.total = doc.questions.length;
    doc.band = scoreToBand(score, doc.questions.length);
    doc.timeSpentSec = Math.min(Math.max(parseInt(req.body.timeSpentSec, 10) || 0, 0), 4 * 60 * 60);
    doc.audioStatus = 'none';
    await doc.save();
    await audioStore.remove(doc._id); // the recording is only needed during the test

    if (doc.mockId) await attachToMock(req.user._id, doc.mockId, 'listening', doc._id, doc.band);

    sendSuccess(res, toResultView(doc), 'Test marked');
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/listening/tests
exports.listTests = async (req, res, next) => {
  try {
    const items = await ListeningTest.find({ userId: req.user._id, status: 'submitted' })
      .select('title kind score total band createdAt')
      .sort('-createdAt')
      .limit(20);
    sendSuccess(
      res,
      items.map((d) => ({ id: d._id, title: d.title, kind: d.kind, score: d.score, total: d.total, band: d.band, createdAt: d.createdAt }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/listening/stats
exports.getStats = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id, status: 'submitted' };
    const count = await ListeningTest.countDocuments(filter);
    const recent = await ListeningTest.find(filter).select('band createdAt').sort('-createdAt').limit(50);
    if (!recent.length) return sendSuccess(res, { count: 0 });
    const bands = recent.map((d) => d.band || 0);
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    sendSuccess(res, {
      count,
      latest: bands[0],
      average: Math.round(mean(bands) * 10) / 10,
      best: Math.max(...bands),
      trend: bands.slice(0, 10).reverse(),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/ielts/listening/tests/:id
exports.deleteTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Listening test not found', 404);
    const result = await ListeningTest.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return sendError(res, 'Listening test not found', 404);
    await audioStore.remove(req.params.id);
    sendSuccess(res, null, 'Listening test deleted');
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/listening/tests/:id/audio-info -> { status, path? }
// The app asks this until the recording is ready; "path" is a short-lived link to the file.
exports.getAudioInfo = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Listening test not found', 404);
    const doc = await ListeningTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Listening test not found', 404);

    let status = doc.audioStatus || 'none';
    // A job that never finished (for example the server restarted) must not keep the learner waiting.
    if (status === 'pending' && Date.now() - new Date(doc.updatedAt || doc.createdAt).getTime() > ttsConfig.staleAfterMs) {
      status = 'failed';
      await ListeningTest.updateOne({ _id: doc._id }, { audioStatus: 'failed', audioError: 'Timed out' });
    }
    if (status === 'ready' && !(await audioStore.exists(doc._id))) {
      status = 'failed';
      await ListeningTest.updateOne({ _id: doc._id }, { audioStatus: 'failed', audioError: 'File missing' });
    }

    sendSuccess(res, {
      status,
      path: status === 'ready' ? `/ielts/listening/audio/${doc._id}?t=${signAudioToken(doc._id, req.user._id)}` : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/listening/audio/:id?t=<token>   (no login header: the link itself carries a short-lived token)
exports.streamAudio = async (req, res, next) => {
  try {
    const payload = verifyAudioToken(req.query.t);
    if (!payload || payload.tid !== String(req.params.id)) {
      return sendError(res, 'This audio link is not valid or has expired.', 403);
    }
    const doc = await ListeningTest.findOne({ _id: payload.tid, userId: payload.uid });
    if (!doc || doc.audioStatus !== 'ready') return sendError(res, 'Audio not found', 404);
    const [user, profile] = await Promise.all([
      User.findById(payload.uid).select('dateOfBirth isActive'),
      LearningProfile.findOne({ userId: payload.uid }).select('currentEnglishLevel englishLevel identityVerification.status'),
    ]);
    const age = ageOnDate(user?.dateOfBirth);
    if (!user?.isActive || age === null || age < 18 || (profile?.currentEnglishLevel || profile?.englishLevel) !== 'advanced' || profile?.identityVerification?.status !== 'verified') {
      return sendError(res, 'IELTS access is no longer available for this account.', 403);
    }
    const file = audioStore.fileFor(doc._id);
    if (!file || !(await audioStore.exists(doc._id))) return sendError(res, 'Audio not found', 404);

    // sendFile also answers "Range" requests, which iPhones need to play a file.
    res.sendFile(file, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' } }, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
};

exports._buildTest = buildTest; // exported for testing
