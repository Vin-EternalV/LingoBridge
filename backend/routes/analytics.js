// routes/analytics.js
const express = require("express");
const {
  surveySummary,
  skillDetail,
} = require("../controllers/analyticsController");
// TODO: Re-enable auth before production / admin panel
// const { protect } = require("../middleware/auth");
// const { authorize } = require("../middleware/authorize");
// const { ROLES } = require("../config/constants");

const router = express.Router();

// TODO: Restore these two lines when you build the admin panel:
// router.use(protect);
// router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

router.get("/survey-summary", surveySummary);
router.get("/skill/:skill", skillDetail);

module.exports = router;
