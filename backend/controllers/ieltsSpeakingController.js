const SpeakingSubmission = require('../models/SpeakingSubmission');
const ieltsService = require('../services/ieltsSpeakingService');
const { logAIInteraction } = require('../utils/aiLogger');
const { attachToMock } = require('./ieltsMockController');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { PARTS, MIN_ANSWER_WORDS, MAX_ANSWER_CHARS, CRITERIA, countWords, toBand, overallBand } = require('../config/ieltsSpeaking');

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems, maxLen) =>
  (Array.isArray(value) ? value : []).map((v) => text(v, maxLen)).filter(Boolean).slice(0, maxItems);

const PRONUNCIATION_NOTE =
  'Pronunciation is not scored because the app marks your words, not your voice. The overall band is the average of the three criteria above.';

const toClient = (doc) => {
  const s = doc.scores || {};
  const f = doc.feedback || {};
  return {
    id: doc._id,
    part: doc.part,
    partLabel: PARTS[doc.part]?.label,
    title: doc.title,
    bullets: doc.bullets || [],
    answers: (doc.answers || []).map((a) => ({
      question: a.question,
      answer: a.answer,
      wordCount: a.wordCount,
      comment: a.comment || '',
      sampleAnswer: a.sampleAnswer || '',
    })),
    totalWords: doc.totalWords,
    timeSpentSec: doc.timeSpentSec,
    overall: s.overall,
    criteria: CRITERIA.map((c) => ({ key: c.key, label: c.label, band: s[c.key], comment: f.comments?.[c.key] || '' })),
    pronunciationNote: PRONUNCIATION_NOTE,
    summary: f.summary || '',
    strengths: f.strengths || [],
    improvements: f.improvements || [],
    corrections: f.corrections || [],
    createdAt: doc.createdAt,
  };
};

// POST /api/ielts/speaking/set   { part, topic? }
exports.getSet = async (req, res, next) => {
  try {
    const { part } = req.body;
    if (!PARTS[part]) return sendError(res, 'Choose Part 1, Part 2 or Part 3.', 400);
    const topic = text(req.body.topic, 80);

    const { data, tokensUsed } = await ieltsService.generateSpeakingSet({ part, topic });

    const needed = PARTS[part].questions;
    const questions = list(data?.questions, needed, 400);
    if (questions.length !== needed) return sendError(res, 'The AI could not create a full question set. Please try again.', 502);

    await logAIInteraction(req.user, {
      type: 'speaking_prompt',
      skill: 'speaking',
      prompt: `IELTS Speaking ${PARTS[part].label}${topic ? ` on ${topic}` : ''}`,
      tokensUsed,
      success: true,
    });

    sendSuccess(res, {
      part,
      title: text(data.title, 150) || `Speaking ${PARTS[part].label}`,
      questions,
      bullets: part === 'part2' ? list(data.bullets, 6, 200) : [],
      minTotalWords: PARTS[part].minTotalWords,
      prepSeconds: PARTS[part].prepSeconds || 0,
      speakSeconds: PARTS[part].speakSeconds || 0,
    });
  } catch (err) {
    await logAIInteraction(req.user, { type: 'speaking_prompt', skill: 'speaking', success: false, errorMessage: err.message });
    next(err);
  }
};

// POST /api/ielts/speaking/submit   { part, set: { title, questions, bullets }, answers: [..], timeSpentSec }
exports.submitAnswers = async (req, res, next) => {
  try {
    const { part } = req.body;
    if (!PARTS[part]) return sendError(res, 'Choose Part 1, Part 2 or Part 3.', 400);

    const questions = list(req.body.set?.questions, 6, 400);
    if (questions.length !== PARTS[part].questions) return sendError(res, 'The questions are missing. Please start a new set.', 400);
    const set = { title: text(req.body.set?.title, 150), questions, bullets: list(req.body.set?.bullets, 6, 200) };

    const raw = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (raw.length !== questions.length) return sendError(res, 'Answer every question first.', 400);

    const answers = [];
    for (let i = 0; i < raw.length; i += 1) {
      if (typeof raw[i] !== 'string') return sendError(res, 'Answer every question first.', 400);
      if (raw[i].length > MAX_ANSWER_CHARS) return sendError(res, `Answer ${i + 1} is too long (maximum ${MAX_ANSWER_CHARS} characters).`, 400);
      const clean = raw[i].trim();
      if (countWords(clean) < MIN_ANSWER_WORDS) {
        return sendError(res, `Answer ${i + 1} needs at least ${MIN_ANSWER_WORDS} words.`, 400);
      }
      answers.push(clean);
    }

    const totalWords = answers.reduce((sum, a) => sum + countWords(a), 0);
    if (totalWords < PARTS[part].minTotalWords) {
      return sendError(res, `Say a little more: ${PARTS[part].minTotalWords} words in total are needed to mark ${PARTS[part].label}.`, 400);
    }
    const timeSpentSec = Math.min(Math.max(parseInt(req.body.timeSpentSec, 10) || 0, 0), 4 * 60 * 60);

    const { data, tokensUsed } = await ieltsService.assessSpeaking({ part, set, answers, totalWords });

    // Bands are rounded to half steps and the overall band is calculated here, not trusted from the AI.
    const scores = {};
    const comments = {};
    for (const { key } of CRITERIA) {
      scores[key] = toBand(data?.[key]?.band);
      comments[key] = text(data?.[key]?.comment, 600);
    }
    scores.overall = overallBand(CRITERIA.map(({ key }) => scores[key]));

    // Corrections must quote the learner's own words exactly.
    const corrections = (Array.isArray(data?.corrections) ? data.corrections : [])
      .map((c) => ({ original: text(c?.original, 300), suggestion: text(c?.suggestion, 300), reason: text(c?.reason, 300) }))
      .filter((c) => c.original && c.suggestion && answers.some((a) => a.includes(c.original)))
      .slice(0, 6);

    const perQuestion = Array.isArray(data?.perQuestion) ? data.perQuestion : [];
    const saved = await SpeakingSubmission.create({
      userId: req.user._id,
      part,
      title: set.title,
      bullets: set.bullets,
      answers: questions.map((question, i) => ({
        question,
        answer: answers[i],
        wordCount: countWords(answers[i]),
        comment: text(perQuestion[i]?.comment, 400),
        sampleAnswer: text(perQuestion[i]?.sampleAnswer, 1000),
      })),
      totalWords,
      timeSpentSec,
      scores,
      feedback: {
        summary: text(data?.summary, 800),
        comments,
        strengths: list(data?.strengths, 5, 300),
        improvements: list(data?.improvements, 5, 300),
        corrections,
      },
    });

    await logAIInteraction(req.user, {
      type: 'speaking_assessment',
      skill: 'speaking',
      prompt: `IELTS Speaking ${PARTS[part].label} (${totalWords} words)`,
      response: { overall: scores.overall },
      tokensUsed,
      success: true,
    });

    // Part of a mock test? Record this section there (never blocks the result).
    if (req.body.mockId) await attachToMock(req.user._id, req.body.mockId, `speaking${part.slice(-1)}`, saved._id, scores.overall);

    sendSuccess(res, toClient(saved), 'Answers marked', 201);
  } catch (err) {
    await logAIInteraction(req.user, { type: 'speaking_assessment', skill: 'speaking', success: false, errorMessage: err.message });
    next(err);
  }
};

// GET /api/ielts/speaking/submissions
exports.listSubmissions = async (req, res, next) => {
  try {
    const items = await SpeakingSubmission.find({ userId: req.user._id })
      .select('part title totalWords scores.overall createdAt')
      .sort('-createdAt')
      .limit(20);

    sendSuccess(
      res,
      items.map((d) => ({
        id: d._id,
        part: d.part,
        partLabel: PARTS[d.part]?.label,
        title: d.title || '',
        overall: d.scores?.overall,
        totalWords: d.totalWords,
        createdAt: d.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/speaking/stats
exports.getStats = async (req, res, next) => {
  try {
    const count = await SpeakingSubmission.countDocuments({ userId: req.user._id });
    const recent = await SpeakingSubmission.find({ userId: req.user._id }).select('scores createdAt').sort('-createdAt').limit(50);
    if (!recent.length) return sendSuccess(res, { count: 0 });

    const overalls = recent.map((d) => d.scores?.overall || 0);
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const criteriaAverages = {};
    for (const { key } of CRITERIA) criteriaAverages[key] = Math.round(mean(recent.map((d) => d.scores?.[key] || 0)) * 10) / 10;

    sendSuccess(res, {
      count,
      latest: overalls[0],
      average: Math.round(mean(overalls) * 10) / 10,
      best: Math.max(...overalls),
      trend: overalls.slice(0, 10).reverse(),
      criteriaAverages,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/speaking/submissions/:id
exports.getSubmission = async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return sendError(res, 'Result not found', 404);
    const doc = await SpeakingSubmission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Result not found', 404);
    sendSuccess(res, toClient(doc));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/ielts/speaking/submissions/:id
exports.deleteSubmission = async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return sendError(res, 'Result not found', 404);
    const result = await SpeakingSubmission.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return sendError(res, 'Result not found', 404);
    sendSuccess(res, null, 'Result deleted');
  } catch (err) {
    next(err);
  }
};
