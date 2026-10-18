// Creates or resets the learner test account to a known password.
// Run from backend/ with:  node scripts/resetLearner.js
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LearningProfile = require("../models/LearningProfile");

if (
  process.env.MONGODB_URI &&
  process.env.MONGODB_URI.startsWith("mongodb+srv://")
) {
  dns.setServers([process.env.MONGODB_DNS_SERVER || "1.1.1.1"]);
}

const EMAIL = "learner@lingobridge.test";
const PASSWORD = "Learner123!";

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing in .env");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  let user = await User.findOne({ email: EMAIL });

  if (!user) {
    // Hash manually so the pre-save hook doesn't double-hash when we use updateOne.
    const hash = await bcrypt.hash(PASSWORD, 12);
    user = await User.create({
      firstName: "Demo",
      lastName: "Learner",
      email: EMAIL,
      password: PASSWORD,
      role: "learner",
      isActive: true,
    });
    console.log(`✅ Created ${EMAIL}`);
  } else {
    // Force-reset password, unlock, and confirm role/active.
    const hash = await bcrypt.hash(PASSWORD, 12);
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hash,
          role: "learner",
          isActive: true,
          loginAttempts: 0,
          lockedUntil: null,
          resetPasswordAttempts: 0,
          resetPasswordLockedUntil: null,
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
        $inc: { tokenVersion: 1 },
      },
    );
    console.log(`✅ Reset ${EMAIL}`);
  }

  // Ensure a LearningProfile exists so the app doesn't choke after login.
  await LearningProfile.updateOne(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        englishLevel: "intermediate",
        learningGoals: ["general"],
        preferredAreas: ["grammar"],
        onboardingComplete: true,
      },
    },
    { upsert: true },
  );
  console.log("✅ LearningProfile ensured");

  // Verify the password hash matches what we just set.
  const fresh = await User.findOne({ email: EMAIL }).select("+password");
  const matches = await fresh.matchPassword(PASSWORD);
  console.log(
    `\nVerify: password "${PASSWORD}" matches? ${matches ? "YES ✅" : "NO ❌"}`,
  );

  await mongoose.disconnect();
})().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
