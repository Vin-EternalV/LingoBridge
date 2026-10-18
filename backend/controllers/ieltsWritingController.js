const WritingSubmission = require('../models/WritingSubmission');
const ieltsService = require('../services/ieltsWritingService');
const { logAIInteraction } = require('../utils/aiLogger');
const { attachToMock } = require('./ieltsMockController');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const {
  TASKS,
  MODULES,
  MIN_SCORABLE_WORDS,
  MAX_WORDS,
  MAX_ESSAY_CHARS,
  CRITERIA,
  countWords,
  toBand,
  overallBand,
} = require('../config/ieltsWriting');

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems, maxLen) =>
  (Array.isArray(value) ? value : []).map((v) => text(v, maxLen)).filter(Boolean).slice(0, maxItems);

// The task text comes back from the app when an essay is submitted, so it is cleaned and size-limited.
const cleanPrompt = (input) => {
  const question = text(input?.question, 1500);
  if (!question) return null;

  let table = null;
  const headers = list(input?.table?.headers, 8, 60);
  if (headers.length && Array.isArray(input?.table?.rows)) {
    const rows = input.table.rows
      .slice(0, 12)
      .map((row) => (Array.isArray(row) ? row.slice(0, 8).map((cell) => text(String(cell ?? ''), 60)) : []))
      .filter((row) => row.length);
    table = { caption: text(input.table.caption, 200), headers, rows };
  }

  return { title: text(input?.title, 150), question, bullets: list(input?.bullets, 6, 200), table };
};

// What the app receives for one marked essay.
const toClient = (doc) => {
  const s = doc.scores || {};
  const f = doc.feedback || {};
  return {
    id: doc._id,
    task: doc.task,
    taskLabel: TASKS[doc.task]?.label,
    module: doc.module,
    prompt: doc.prompt,
    essay: doc.essay,
    wordCount: doc.wordCount,
    minWords: doc.minWords,
    underLength: doc.wordCount < doc.minWords,
    timeSpentSec: doc.timeSpentSec,
    overall: s.overall,
    criteria: CRITERIA.map((c) => ({
      key: c.key,
      label: c.label[doc.task],
      band: s[c.key],
      comment: f.comments?.[c.key] || '',
    })),
    summary: f.summary || '',
    strengths: f.strengths || [],
    improvements: f.improvements || [],
    corrections: f.corrections || [],
    createdAt: doc.createdAt,
  };
};

// POST /api/ielts/writing/prompt   { task, module?, topic? }
exports.getPrompt = async (req, res, next) => {
  try {
    const { task } = req.body;
    const module = MODULES.includes(req.body.module) ? req.body.module : 'academic';
    if (!TASKS[task]) return sendError(res, 'Choose Task 1 or Task 2.', 400);
    const topic = text(req.body.topic, 80);

    const { data, tokensUsed } = await ieltsService.generateWritingPrompt({ task, module, topic });

    const question = text(data?.question, 1500);
    if (!question) return sendError(res, 'The AI could not create a task. Please try again.', 502);

    const headers = list(data.tableHeaders, 8, 60);
    const table =
      task === 'task1' && module === 'academic' && headers.length
        ? {
            caption: text(data.tableCaption, 200),
            headers,
            rows: (Array.isArray(data.tableRows) ? data.tableRows : [])
              .slice(0, 12)
              .map((row) => (Array.isArray(row) ? row.slice(0, 8).map((c) => text(String(c ?? ''), 60)) : []))
              .filter((row) => row.length),
          }
        : null;

    await logAIInteraction(req.user, {
      type: 'writing_prompt',
      skill: 'writing',
      prompt: `IELTS ${TASKS[task].label} ${module} task${topic ? ` on ${topic}` : ''}`,
      tokensUsed,
      success: true,
    });

    sendSuccess(res, {
      task,
      module,
      title: text(data.title, 150) || `${TASKS[task].label} practice`,
      question,
      bullets: task === 'task1' && module === 'general' ? list(data.bullets, 6, 200) : [],
      table,
      minWords: TASKS[task].minWords,
      minutes: TASKS[task].minutes,
    });
  } catch (err) {
    await logAIInteraction(req.user, { type: 'writing_prompt', skill: 'writing', success: false, errorMessage: err.message });
    next(err);
  }
};

// POST /api/ielts/writing/submit   { task, module, prompt, essay, timeSpentSec }
exports.submitEssay = async (req, res, next) => {
  try {
    const { task, essay } = req.body;
    if (!TASKS[task]) return sendError(res, 'Choose Task 1 or Task 2.', 400);
    const module = MODULES.includes(req.body.module) ? req.body.module : 'academic';

    const prompt = cleanPrompt(req.body.prompt);
    if (!prompt) return sendError(res, 'The task text is missing. Please get a new task.', 400);

    if (typeof essay !== 'string' || !essay.trim()) return sendError(res, 'Write your essay first.', 400);
    if (essay.length > MAX_ESSAY_CHARS) return sendError(res, `Your essay is too long (maximum ${MAX_ESSAY_CHARS} characters).`, 400);

    const cleanEssay = essay.trim();
    const wordCount = countWords(cleanEssay);
    if (wordCount < MIN_SCORABLE_WORDS) {
      return sendError(res, `Write at least ${MIN_SCORABLE_WORDS} words so your essay can be marked.`, 400);
    }
    if (wordCount > MAX_WORDS) return sendError(res, `Your essay is over ${MAX_WORDS} words. Please shorten it.`, 400);

    const minWords = TASKS[task].minWords;
    const timeSpentSec = Math.min(Math.max(parseInt(req.body.timeSpentSec, 10) || 0, 0), 4 * 60 * 60);

    const { data, tokensUsed } = await ieltsService.assessWriting({ task, module, prompt, essay: cleanEssay, wordCount, minWords });

    // Bands are rounded to half steps and the overall band is calculated here, not trusted from the AI.
    const scores = {};
    const comments = {};
    for (const { key } of CRITERIA) {
      scores[key] = toBand(data?.[key]?.band);
      comments[key] = text(data?.[key]?.comment, 600);
    }
    scores.overall = overallBand(CRITERIA.map(({ key }) => scores[key]));

    // Keep only corrections that quote the essay exactly, so a made-up quote never reaches the learner.
    const corrections = (Array.isArray(data?.corrections) ? data.corrections : [])
      .map((c) => ({ original: text(c?.original, 300), suggestion: text(c?.suggestion, 300), reason: text(c?.reason, 300) }))
      .filter((c) => c.original && c.suggestion && cleanEssay.includes(c.original))
      .slice(0, 6);

    const submission = await WritingSubmission.create({
      userId: req.user._id,
      task,
      module,
      prompt,
      essay: cleanEssay,
      wordCount,
      minWords,
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
      type: 'writing_assessment',
      skill: 'writing',
      prompt: `IELTS ${TASKS[task].label} essay (${wordCount} words)`,
      response: { overall: scores.overall },
      tokensUsed,
      success: true,
    });

    // Part of a mock test? Record this section there (never blocks the result).
    if (req.body.mockId) await attachToMock(req.user._id, req.body.mockId, task === 'task1' ? 'writing1' : 'writing2', submission._id, scores.overall);

    sendSuccess(res, toClient(submission), 'Essay marked', 201);
  } catch (err) {
    await logAIInteraction(req.user, { type: 'writing_assessment', skill: 'writing', success: false, errorMessage: err.message });
    next(err);
  }
};

// GET /api/ielts/writing/submissions   (latest 20, newest first)
exports.listSubmissions = async (req, res, next) => {
  try {
    const items = await WritingSubmission.find({ userId: req.user._id })
      .select('task module prompt.title wordCount scores.overall createdAt')
      .sort('-createdAt')
      .limit(20);

    sendSuccess(
      res,
      items.map((d) => ({
        id: d._id,
        task: d.task,
        taskLabel: TASKS[d.task]?.label,
        module: d.module,
        title: d.prompt?.title || '',
        overall: d.scores?.overall,
        wordCount: d.wordCount,
        createdAt: d.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/writing/stats
exports.getStats = async (req, res, next) => {
  try {
    const count = await WritingSubmission.countDocuments({ userId: req.user._id });
    const recent = await WritingSubmission.find({ userId: req.user._id })
      .select('scores createdAt')
      .sort('-createdAt')
      .limit(50);

    if (!recent.length) return sendSuccess(res, { count: 0 });

    const overalls = recent.map((d) => d.scores?.overall || 0);
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const criteriaAverages = {};
    for (const { key } of CRITERIA) {
      criteriaAverages[key] = Math.round(mean(recent.map((d) => d.scores?.[key] || 0)) * 10) / 10;
    }

    sendSuccess(res, {
      count,
      latest: overalls[0],
      average: Math.round(mean(overalls) * 10) / 10,
      best: Math.max(...overalls),
      trend: overalls.slice(0, 10).reverse(), // oldest to newest
      criteriaAverages,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/writing/submissions/:id
exports.getSubmission = async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return sendError(res, 'Essay not found', 404);
    const doc = await WritingSubmission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return sendError(res, 'Essay not found', 404);
    sendSuccess(res, toClient(doc));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/ielts/writing/submissions/:id
exports.deleteSubmission = async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return sendError(res, 'Essay not found', 404);
    const result = await WritingSubmission.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return sendError(res, 'Essay not found', 404);
    sendSuccess(res, null, 'Essay deleted');
  } catch (err) {
    next(err);
  }
};
