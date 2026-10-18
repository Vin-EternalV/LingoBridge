// Creates one account for each role: learner, admin, superadmin.
// Usage (from the backend folder):  npm run seed
// Safe to run more than once: existing emails are kept
// (role/active status are fixed, password is not changed).
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const dns = require("dns");
const mongoose = require("mongoose");
const User = require("../models/User");
const LearningProfile = require("../models/LearningProfile");
const { ROLES } = require("../config/constants");

// Windows DNS resolvers sometimes return malformed SRV replies for Atlas.
// Same workaround as config/db.js.
if (
  process.env.MONGODB_URI &&
  process.env.MONGODB_URI.startsWith("mongodb+srv://")
) {
  dns.setServers([process.env.MONGODB_DNS_SERVER || "1.1.1.1"]);
}

const ACCOUNTS = [
  {
    firstName: "Super",
    lastName: "Admin",
    email: process.env.SEED_SUPERADMIN_EMAIL || "superadmin@lingobridge.test",
    password: process.env.SEED_SUPERADMIN_PASSWORD || "SuperAdmin123!",
    role: ROLES.SUPERADMIN,
  },
  {
    firstName: "Demo",
    lastName: "Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@lingobridge.test",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    role: ROLES.ADMIN,
  },
  {
    firstName: "Demo",
    lastName: "Learner",
    email: process.env.SEED_LEARNER_EMAIL || "learner@lingobridge.test",
    password: process.env.SEED_LEARNER_PASSWORD || "Learner123!",
    role: ROLES.LEARNER,
  },
];

const run = async () => {
  // Refuse to seed in production unless explicitly overridden.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_SEED_IN_PROD !== "true"
  ) {
    throw new Error(
      "Refusing to seed in production. Set ALLOW_SEED_IN_PROD=true to override (only for initial setup).",
    );
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const account of ACCOUNTS) {
    let user = await User.findOne({ email: account.email.toLowerCase() });

    if (user) {
      user.role = account.role;
      user.isActive = true;
      await user.save({ validateBeforeSave: false });
      console.log(`exists   ${account.role.padEnd(10)} ${account.email}`);
    } else {
      user = await User.create(account);
      console.log(`created  ${account.role.padEnd(10)} ${account.email}`);
    }

    if (account.role === ROLES.LEARNER) {
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
    }
  }

  console.log("\nDone. Change these passwords before using the app for real.");
};

run()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
