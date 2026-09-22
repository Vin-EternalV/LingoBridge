// routes/survey.js
const express = require("express");
const {
  submitSurvey,
  listSurveys,
  getMySurvey,
} = require("../controllers/surveyController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { optionalAuth } = require("../middleware/optionalAuth");
const { ROLES } = require("../config/constants");

const router = express.Router();

// Public — anonymous OR logged-in. If a valid Bearer token is present,
// the survey gets linked to req.user. Otherwise userId stays null.
router.post("/", optionalAuth, submitSurvey);

// Logged-in learner can fetch their own latest submission
router.get("/me", protect, getMySurvey);

// Admin-only listing
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.SUPERADMIN), listSurveys);

module.exports = router;
