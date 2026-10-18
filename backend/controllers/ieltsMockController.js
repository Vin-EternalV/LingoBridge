// A mock test is a guided run through several sections, each saved like normal practice.
// When the last section is marked, the skill bands and an estimated overall band are worked out here.
const MockTest = require('../models/MockTest');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { toBand, overallBand } = require('../config/ieltsWriting');

const PLANS = {
  short: ['reading', 'writing2', 'speaking2'],
  full: ['reading', 'writing1', 'writing2', 'speaking1', 'speaking2', 'speaking3'],
};

const SECTION_INFO = {
  reading: { skill: 'reading', label: 'Reading', detail: '1 passage · 13 questions · 20 min' },
  writing1: { skill: 'writing', label: 'Writing Task 1', detail: '150+ words · 20 min' },
  writing2: { skill: 'writing', label: 'Writing Task 2', detail: '250+ words · 40 min' },
  speaking1: { skill: 'speaking', label: 'Speaking Part 1', detail: '4 short questions' },
  speaking2: { skill: 'speaking', label: 'Speaking Part 2', detail: 'Cue card · 1 min prep + 2 min talk' },
  speaking3: { skill: 'speaking', label: 'Speaking Part 3', detail: '4 discussion questions' },
};

const isId = (id) => /^[a-f\d]{24}$/i.test(String(id || ''));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Skill bands from the finished sections. Writing Task 2 counts double, as in real IELTS.
const computeResults = (mock) => {
  const done = (key) => mock.sections.find((s) => s.key === key && s.status === 'done')?.band;
  const skillBands = {};

  const reading = done('reading');
  if (typeof reading === 'number') skillBands.reading = reading;

  const w1 = done('writing1');
  const w2 = done('writing2');
  if (typeof w1 === 'number' && typeof w2 === 'number') skillBands.writing = toBand((w1 + 2 * w2) / 3);
  else if (typeof w2 === 'number') skillBands.writing = w2;
  else if (typeof w1 === 'number') skillBands.writing = w1;

  const parts = ['speaking1', 'speaking2', 'speaking3'].map(done).filter((b) => typeof b === 'number');
  if (parts.length) skillBands.speaking = toBand(mean(parts));

  const values = Object.values(skillBands);
  return { skillBands, overall: values.length ? overallBand(values) : undefined };
};

const toClient = (mock) => ({
  id: mock._id,
  type: mock.type,
  status: mock.status,
  startedAt: mock.createdAt,
  completedAt: mock.completedAt,
  overall: mock.overall,
  skillBands: mock.skillBands || {},
  sections: mock.sections.map((s) => ({
    key: s.key,
    skill: s.skill,
    label: SECTION_INFO[s.key]?.label || s.key,
    detail: SECTION_INFO[s.key]?.detail || '',
    status: s.status,
    band: s.band,
    refId: s.refId || null,
  })),
  note: 'Listening is not included, so this is not a full IELTS overall band.',
});

// Called by the Reading, Writing and Speaking submit endpoints when the section belongs to a mock test.
// It never throws: a problem with the mock must not stop the learner's work from being saved.
exports.attachToMock = async (userId, mockId, key, refId, band) => {
  try {
    if (!isId(mockId)) return null;
    const mock = await MockTest.findOne({ _id: mockId, userId, status: 'in_progress' });
    if (!mock) return null;
    const section = mock.sections.find((s) => s.key === key && s.status === 'pending');
    if (!section) return null;

    section.status = 'done';
    section.refId = refId;
    section.band = band;

    if (mock.sections.every((s) => s.status === 'done')) {
      const { skillBands, overall } = computeResults(mock);
      mock.skillBands = skillBands;
      mock.overall = overall;
      mock.status = 'completed';
      mock.completedAt = new Date();
    }
    mock.markModified('sections');
    await mock.save();
    return mock;
  } catch (err) {
    console.warn(`Could not attach section to mock test: ${err.message}`);
    return null;
  }
};

// POST /api/ielts/mock/start   { type: 'short' | 'full' }
exports.startMock = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!PLANS[type]) return sendError(res, 'Choose a short or full mock test.', 400);

    // One mock at a time: carry on with the unfinished one instead of starting a second.
    const existing = await MockTest.findOne({ userId: req.user._id, status: 'in_progress' });
    if (existing) return sendSuccess(res, { ...toClient(existing), resumed: true }, 'Continuing your mock test');

    const mock = await MockTest.create({
      userId: req.user._id,
      type,
      sections: PLANS[type].map((key) => ({ key, skill: SECTION_INFO[key].skill })),
    });
    sendSuccess(res, { ...toClient(mock), resumed: false }, 'Mock test started', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/ielts/mock/:id
exports.getMock = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Mock test not found', 404);
    const mock = await MockTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mock) return sendError(res, 'Mock test not found', 404);
    sendSuccess(res, toClient(mock));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/ielts/mock/:id   (also how a learner abandons an unfinished mock)
exports.deleteMock = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return sendError(res, 'Mock test not found', 404);
    const result = await MockTest.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return sendError(res, 'Mock test not found', 404);
    sendSuccess(res, null, 'Mock test deleted');
  } catch (err) {
    next(err);
  }
};

exports._computeResults = computeResults;
exports._SECTION_INFO = SECTION_INFO;
