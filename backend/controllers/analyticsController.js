// controllers/analyticsController.js
const SurveyResponse = require("../models/SurveyResponse");
const User = require("../models/User");
const PracticeSession = require("../models/PracticeSession");
const { sendSuccess } = require("../utils/responseHelper");

const SKILLS = ["grammar", "vocabulary", "reading", "speaking", "writing"];
const FREQ_ORDER = ["never", "rarely", "weekly", "several_times_week", "daily"];

/**
 * GET /api/analytics/survey-summary
 * Descriptive analysis:
 *   - Mean difficulty per skill
 *   - Frequency + percentage distribution per skill
 *   - Practice frequency distribution
 *   - Time spent averages
 *   - Priority ranking + insight text
 */
exports.surveySummary = async (req, res, next) => {
  try {
    const [total, learnerCount] = await Promise.all([
      SurveyResponse.countDocuments(),
      User.countDocuments({ role: "learner" }),
    ]);
    const responseRate = learnerCount ? +((total / learnerCount) * 100).toFixed(1) : 0;
    if (total === 0) {
      return sendSuccess(
        res,
        {
          totalResponses: 0,
          totalLearners: learnerCount,
          responseRate,
          meanDifficulty: Object.fromEntries(SKILLS.map((skill) => [skill, 0])),
          distribution: Object.fromEntries(SKILLS.map((skill) => [skill, {
            counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          }])),
          practiceFrequency: FREQ_ORDER.map((frequency) => ({ frequency, count: 0, percentage: 0 })),
          behaviorAccuracy: FREQ_ORDER.map((frequency) => ({
            frequency, learners: 0, learnersWithSessions: 0, averageAccuracy: null, averageCompletedSessions: 0,
          })),
          timeSpent: { avgMinutesPerSession: 0, avgSessionsPerWeek: 0, avgWeeklyMinutes: 0 },
          priorityRanking: [],
          insights: null,
          message: "No survey data yet.",
        },
        "Empty dataset",
      );
    }

    // --- 1. Mean difficulty per skill ---
    const [agg] = await SurveyResponse.aggregate([
      {
        $group: {
          _id: null,
          grammar: { $avg: "$difficulty.grammar" },
          vocabulary: { $avg: "$difficulty.vocabulary" },
          reading: { $avg: "$difficulty.reading" },
          speaking: { $avg: "$difficulty.speaking" },
          writing: { $avg: "$difficulty.writing" },
        },
      },
    ]);

    const meanDifficulty = {};
    SKILLS.forEach((s) => {
      meanDifficulty[s] = +(agg?.[s] ?? 0).toFixed(2);
    });

    // --- 2. Distribution per skill (counts + percentages) ---
    const distribution = {};
    for (const skill of SKILLS) {
      const rows = await SurveyResponse.aggregate([
        { $group: { _id: `$difficulty.${skill}`, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      rows.forEach((r) => {
        if (counts[r._id] !== undefined) counts[r._id] = r.count;
      });
      const percentages = {};
      Object.keys(counts).forEach((k) => {
        percentages[k] = +((counts[k] / total) * 100).toFixed(2);
      });
      distribution[skill] = { counts, percentages };
    }

    // --- 3. Practice frequency distribution ---
    const freqRows = await SurveyResponse.aggregate([
      { $group: { _id: "$practiceFrequency", count: { $sum: 1 } } },
    ]);
    const practiceFrequency = FREQ_ORDER.map((f) => {
      const row = freqRows.find((r) => r._id === f);
      const count = row?.count || 0;
      return {
        frequency: f,
        count,
        percentage: +((count / total) * 100).toFixed(2),
      };
    });

    // Compare self-reported practice frequency with completed-session accuracy.
    const behaviorAccuracyRows = await SurveyResponse.aggregate([
      {
        $lookup: {
          from: PracticeSession.collection.name,
          let: { learnerId: "$userId" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$userId", "$$learnerId"] }, { $eq: ["$status", "completed"] }] } } },
            { $group: { _id: null, averageAccuracy: { $avg: "$accuracy" }, completedSessions: { $sum: 1 } } },
          ],
          as: "sessionStats",
        },
      },
      { $unwind: { path: "$sessionStats", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$practiceFrequency",
          learners: { $sum: 1 },
          learnersWithSessions: { $sum: { $cond: [{ $gt: ["$sessionStats.completedSessions", 0] }, 1, 0] } },
          averageAccuracy: { $avg: "$sessionStats.averageAccuracy" },
          averageCompletedSessions: { $avg: { $ifNull: ["$sessionStats.completedSessions", 0] } },
        },
      },
    ]);
    const behaviorAccuracy = FREQ_ORDER.map((frequency) => {
      const row = behaviorAccuracyRows.find((item) => item._id === frequency);
      return {
        frequency,
        learners: row?.learners || 0,
        learnersWithSessions: row?.learnersWithSessions || 0,
        averageAccuracy: row?.averageAccuracy == null ? null : +row.averageAccuracy.toFixed(1),
        averageCompletedSessions: +(row?.averageCompletedSessions || 0).toFixed(1),
      };
    });

    // --- 4. Time spent averages ---
    const [timeAgg] = await SurveyResponse.aggregate([
      {
        $group: {
          _id: null,
          avgMinutesPerSession: { $avg: "$minutesPerSession" },
          avgSessionsPerWeek: { $avg: "$sessionsPerWeek" },
          avgWeeklyMinutes: {
            $avg: { $multiply: ["$minutesPerSession", "$sessionsPerWeek"] },
          },
        },
      },
    ]);

    // --- 5. Priority ranking (higher mean = harder = higher priority) ---
    const priorityRanking = [...SKILLS]
      .map((s) => ({ skill: s, meanDifficulty: meanDifficulty[s] }))
      .sort((a, b) => b.meanDifficulty - a.meanDifficulty);

    const hardest = priorityRanking[0];
    const easiest = priorityRanking[priorityRanking.length - 1];

    return sendSuccess(
      res,
      {
        totalResponses: total,
        totalLearners: learnerCount,
        responseRate,
        meanDifficulty,
        distribution,
        practiceFrequency,
        behaviorAccuracy,
        timeSpent: {
          avgMinutesPerSession: +(timeAgg?.avgMinutesPerSession || 0).toFixed(
            1,
          ),
          avgSessionsPerWeek: +(timeAgg?.avgSessionsPerWeek || 0).toFixed(1),
          avgWeeklyMinutes: +(timeAgg?.avgWeeklyMinutes || 0).toFixed(1),
        },
        priorityRanking,
        insights: {
          hardestSkill: hardest.skill,
          easiestSkill: easiest.skill,
          recommendation: `Focus LingoBridge content first on "${hardest.skill}" (mean difficulty ${hardest.meanDifficulty}/5).`,
        },
      },
      "Survey summary generated",
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/skill/:skill
 * Drill-down for a single skill.
 */
exports.skillDetail = async (req, res, next) => {
  try {
    const { skill } = req.params;
    if (!SKILLS.includes(skill)) {
      return res.status(400).json({ success: false, message: "Invalid skill" });
    }
    const rows = await SurveyResponse.aggregate([
      { $group: { _id: `$difficulty.${skill}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const total = rows.reduce((s, r) => s + r.count, 0);
    return sendSuccess(
      res,
      { skill, total, distribution: rows },
      `${skill} detail`,
    );
  } catch (err) {
    next(err);
  }
};
