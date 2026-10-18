// controllers/analyticsController.js
const SurveyResponse = require("../models/SurveyResponse");
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
    const total = await SurveyResponse.countDocuments();
    if (total === 0) {
      return sendSuccess(
        res,
        { totalResponses: 0, message: "No survey data yet." },
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
        meanDifficulty,
        distribution,
        practiceFrequency,
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
