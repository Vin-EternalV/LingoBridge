// One summary of a learner's IELTS practice across Reading, Writing and Speaking, plus mock tests and a target band.
const ReadingTest = require('../models/ReadingTest');
const WritingSubmission = require('../models/WritingSubmission');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const MockTest = require('../models/MockTest');
const IeltsProfile = require('../models/IeltsProfile');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { overallBand, CRITERIA: WRITING_CRITERIA } = require('../config/ieltsWriting');
const { CRITERIA: SPEAKING_CRITERIA } = require('../config/ieltsSpeaking');

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (n) => Math.round(n * 10) / 10;
const RECENT = 5; // an estimate uses the learner's latest 5 results per skill

// docs are newest first
const summarise = (count, bands) => {
  if (!bands.length) return { count: 0 };
  return {
    count,
    latest: bands[0],
    average: round1(mean(bands)),
    best: Math.max(...bands),
    recentAverage: round1(mean(bands.slice(0, RECENT))),
    trend: bands.slice(0, 10).reverse(), // oldest to newest
  };
};

const lowestCriterion = (docs, criteria, labelOf) => {
  if (!docs.length) return null;
  const rows = criteria.map((c) => ({
    key: c.key,
    label: labelOf(c),
    average: mean(docs.slice(0, 10).map((d) => d.scores?.[c.key] || 0)),
  }));
  rows.sort((a, b) => a.average - b.average);
  return { label: rows[0].label, average: round1(rows[0].average) };
};

// GET /api/ielts/progress
exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const readingFilter = { userId, status: 'submitted' };

    const [rCount, wCount, sCount, reading, writing, speaking, profile, mocks, inProgress] = await Promise.all([
      ReadingTest.countDocuments(readingFilter),
      WritingSubmission.countDocuments({ userId }),
      SpeakingSubmission.countDocuments({ userId }),
      ReadingTest.find(readingFilter).select('band createdAt').sort('-createdAt').limit(50),
      WritingSubmission.find({ userId }).select('scores createdAt').sort('-createdAt').limit(50),
      SpeakingSubmission.find({ userId }).select('scores createdAt').sort('-createdAt').limit(50),
      IeltsProfile.findOne({ userId }),
      MockTest.find({ userId, status: 'completed' }).select('type overall skillBands completedAt createdAt').sort('-createdAt').limit(5),
      MockTest.findOne({ userId, status: 'in_progress' }).select('_id type createdAt'),
    ]);

    const skills = {
      reading: summarise(rCount, reading.map((d) => d.band || 0)),
      writing: summarise(wCount, writing.map((d) => d.scores?.overall || 0)),
      speaking: summarise(sCount, speaking.map((d) => d.scores?.overall || 0)),
    };

    const withData = Object.entries(skills).filter(([, s]) => s.count > 0);
    const estimatedOverall = withData.length ? overallBand(withData.map(([, s]) => s.recentAverage)) : null;

    // What to practise next: the weakest skill, and within it the weakest criterion.
    let focus = null;
    if (withData.length) {
      const [skill] = [...withData].sort((a, b) => a[1].recentAverage - b[1].recentAverage)[0];
      let criterion = null;
      if (skill === 'writing') criterion = lowestCriterion(writing, WRITING_CRITERIA, (c) => c.label.task2);
      if (skill === 'speaking') criterion = lowestCriterion(speaking, SPEAKING_CRITERIA, (c) => c.label);
      focus = { skill, criterion: criterion?.label || null, onlyOneSkill: withData.length === 1 };
    }

    sendSuccess(res, {
      targetBand: profile?.targetBand ?? null,
      skills,
      estimatedOverall,
      skillsUsed: withData.length,
      focus,
      mocks: mocks.map((m) => ({
        id: m._id,
        type: m.type,
        overall: m.overall,
        skillBands: m.skillBands || {},
        date: m.completedAt || m.createdAt,
      })),
      mockInProgress: inProgress ? { id: inProgress._id, type: inProgress.type } : null,
      note: 'Estimates only. Listening is not included, so this is not a full IELTS overall band.',
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/ielts/target   { targetBand }
exports.setTarget = async (req, res, next) => {
  try {
    const target = Number(req.body.targetBand);
    if (!Number.isFinite(target) || target < 4 || target > 9 || (target * 2) % 1 !== 0) {
      return sendError(res, 'Choose a target band between 4.0 and 9.0 in steps of 0.5.', 400);
    }
    const saved = await IeltsProfile.findOneAndUpdate(
      { userId: req.user._id },
      { targetBand: target },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    sendSuccess(res, { targetBand: saved.targetBand }, 'Target saved');
  } catch (err) {
    next(err);
  }
};
