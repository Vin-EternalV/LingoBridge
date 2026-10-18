const ReadingTest = require('../models/ReadingTest');
const MockTest = require('../models/MockTest');
const ieltsService = require('../services/ieltsReadingService');
const { attachToMock } = require('./ieltsMockController');
const { logAIInteraction } = require('../utils/aiLogger');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { READING, TFNG, TYPE_ORDER, scoreToBand, normalize, stripArticle } = require('../config/ieltsReading');
const { countWords } = require('../config/ieltsWriting');

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems, maxLen) =>
  (Array.isArray(value) ? value : []).map((v) => text(v, maxLen)).filter(Boolean).slice(0, maxItems);
const squash = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const isId = (id) => /^[a-f\d]{24}$/i.test(String(id || ''));

// Turns the AI's raw output into a clean test, dropping any question whose answer key can't be trusted.
const buildTest = (data) => {
  const paragraphs = list(data?.paragraphs, 6, 3000).filter((p) => p.length >= 30);
  if (paragraphs.length < 4) return null;
  const labelled = paragraphs.map((t, i) => ({ label: LETTERS[i], text: t }));
  const passage = squash(labelled.map((p) => p.text).join(' '));
  if (countWords(passage) < READING.minPassageWords) return null;

  const headings = [...new Set(list(data?.headings, 10, 120))];
  const headingKey = new Map(headings.map((h) => [normalize(h), h]));
  const validLabels = labelled.map((p) => p.label);

  const questions = [];
  for (const raw of Array.isArray(data?.questions) ? data.questions : []) {
    const type = raw?.type;
    const question = text(raw?.question, 500);
    const answerRaw = text(raw?.answer, 200);
    if (!TYPE_ORDER.includes(type) || !question || !answerRaw) continue;

    let evidence = text(raw?.evidence, 500);
    if (evidence && !passage.includes(squash(evidence))) evidence = ''; // never show a quote that isn't in the passage
    const base = { type, question, explanation: text(raw?.explanation, 400), evidence, paragraph: '', options: [], acceptedAnswers: [] };
    const paragraph = text(raw?.paragraph, 2).toUpperCase();
    if (validLabels.includes(paragraph)) base.paragraph = paragraph;

    if (type === 'tfng') {
      const answer = TFNG.find((t) => normalize(t) === normalize(answerRaw));
      if (!answer) continue;
      questions.push({ ...base, options: TFNG, answer });
    } else if (type === 'mcq') {
      const options = list(raw?.options, 4, 300);
      if (options.length !== 4 || new Set(options.map(normalize)).size !== 4) continue;
      const answer = options.find((o) => normalize(o) === normalize(answerRaw));
      if (!answer) continue;
      questions.push({ ...base, options, answer });
    } else if (type === 'heading') {
      const answer = headingKey.get(normalize(answerRaw));
      const label = validLabels.includes(paragraph) ? paragraph : '';
      if (!answer || !label || headings.length < 4) continue;
      questions.push({ ...base, question: `Paragraph ${label}`, paragraph: label, options: [], answer });
    } else if (type === 'completion') {
      const answer = normalize(answerRaw);
      if (!answer || countWords(answer) > 3 || !squash(passage).includes(answer) || !question.includes('___')) continue;
      const accepted = list(raw?.acceptedAnswers, 5, 60).map(normalize).filter((a) => a && countWords(a) <= 3);
      questions.push({ ...base, answer: answerRaw, acceptedAnswers: [...new Set(accepted)] });
    }
  }

  // Two heading questions can't share a paragraph, and the order on screen follows TYPE_ORDER.
  const seenParagraphs = new Set();
  const unique = questions.filter((q) => {
    if (q.type !== 'heading') return true;
    if (seenParagraphs.has(q.paragraph)) return false;
    seenParagraphs.add(q.paragraph);
    return true;
  });
  unique.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  const finalQuestions = unique.slice(0, READING.maxQuestions);
  if (finalQuestions.length < READING.minQuestions) return null;

  const usesHeadings = finalQuestions.some((q) => q.type === 'heading');
  return {
    title: text(data?.title, 150),
    paragraphs: labelled,
    headings: usesHeadings ? headings : [],
    questions: finalQuestions,
  };
};

// What the app is allowed to see before the test is submitted: no answers, no explanations.
const toTakeView = (doc, elapsedSec = 0) => ({
  id: doc._id,
  title: doc.title,
  paragraphs: doc.paragraphs,
  headings: doc.headings,
  questions: doc.questions.map((q, index) => ({ index, type: q.type, question: q.question, options: q.options })),
  minutes: doc.minutes,
  elapsedSec,
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
  title: doc.title,
  paragraphs: doc.paragraphs,
  headings: doc.headings,
  score: doc.score,
  total: doc.total,
  band: doc.band,
  minutes: doc.minutes,
  timeSpentSec: doc.timeSpentSec,
  createdAt: doc.createdAt,
  review: doc.questions.map((q, i) => ({
    index: i,
    type: q.type,
    question: q.question,
    options: q.options,
    yourAnswer: doc.answers?.[i] || '',
    correctAnswer: q.answer,
    correct: !!doc.correct?.[i],
    paragraph: q.paragraph,
    explanation: q.explanation,
    evidence: q.evidence,
  })),
});

// POST /api/ielts/reading/start   { topic?, mockId? }
exports.startTest = async (req, res, next) => {
  try {
    const topic = text(req.body.topic, 80);

    let mock = null;
    if (req.body.mockId) {
      if (!isId(req.body.mockId)) return sendError(res, 'Mock test not found.', 404);
      mock = await MockTest.findOne({ _id: req.body.mockId, userId: req.user._id, status: 'in_progress' });
      const section = mock?.sections.find((s) => s.key === 'reading' && s.status === 'pending');
      if (!section) return sendError(res, 'This mock test has no Reading section waiting.', 400);
    }

    const { data, tokensUsed } = await ieltsService.generateReadingTest({ topic });
    const built = buildTest(data);
    if (!built) return sendError(res, 'The AI could not create a complete reading test. Please try again.', 502);

    const doc = await ReadingTest.create({
      userId: req.user._id,
      mockId: mock ? mock._id : undefined,
      ...built,
      minutes: READING.minutes,
    });

    if (mock) {
      mock.sections.find((s) => s.key === 'reading').refId = doc._id; // lets the mock hub resume this test
      mock.markModified('sections');
      await mock.save();
    }

    await logAIInteraction(req.user, {
      type: 'reading_prompt',
      skill: 'reading',
      prompt: `IELTS Reading test${topic ? ` on ${topic}` : ''}`,
      tokensUsed,
      success: true,
    });

    sendSuccess(res, toTakeView(doc), 'Reading test ready', 201);
  } catch (err) {
    await logAIInteraction(req.user, { type: 'reading_prompt', skill: 'reading', success: false, errorMessage: err.message });
    next(err);
  }
};

// GET /api/ielts/reading/tests/:id  -> { status: 'ready', test } or { status: 'submitted', result }
exports.getTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Reading test not found', 404);
    const doc = await ReadingTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Reading test not found', 404);
    if (doc.status === 'submitted') return sendSuccess(res, { status: 'submitted', result: toResultView(doc) });
    const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(doc.createdAt).getTime()) / 1000));
    sendSuccess(res, { status: 'ready', test: toTakeView(doc, elapsedSec) });
  } catch (err) {
    next(err);
  }
};

// POST /api/ielts/reading/tests/:id/submit   { answers: [string], timeSpentSec }
exports.submitTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Reading test not found', 404);
    const doc = await ReadingTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Reading test not found', 404);
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
    await doc.save();

    if (doc.mockId) await attachToMock(req.user._id, doc.mockId, 'reading', doc._id, doc.band);

    sendSuccess(res, toResultView(doc), 'Test marked');
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/reading/tests   (submitted tests, newest first)
exports.listTests = async (req, res, next) => {
  try {
    const items = await ReadingTest.find({ userId: req.user._id, status: 'submitted' })
      .select('title score total band createdAt')
      .sort('-createdAt')
      .limit(20);
    sendSuccess(
      res,
      items.map((d) => ({ id: d._id, title: d.title, score: d.score, total: d.total, band: d.band, createdAt: d.createdAt }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/reading/stats
exports.getStats = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id, status: 'submitted' };
    const count = await ReadingTest.countDocuments(filter);
    const recent = await ReadingTest.find(filter).select('band createdAt').sort('-createdAt').limit(50);
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

// DELETE /api/ielts/reading/tests/:id
exports.deleteTest = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Reading test not found', 404);
    const result = await ReadingTest.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return sendError(res, 'Reading test not found', 404);
    sendSuccess(res, null, 'Reading test deleted');
  } catch (err) {
    next(err);
  }
};

exports._buildTest = buildTest; // exported for testing
