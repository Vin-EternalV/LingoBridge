// Unlocks a user who is in lockout. Run from backend/ with:
//   node scripts/unlockUser.js
//   node scripts/unlockUser.js someone@example.com
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");
const User = require("../models/User");

if (
  process.env.MONGODB_URI &&
  process.env.MONGODB_URI.startsWith("mongodb+srv://")
) {
  dns.setServers([process.env.MONGODB_DNS_SERVER || "1.1.1.1"]);
}

const email = (process.argv[2] || "learner@lingobridge.test").toLowerCase();

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing in .env");
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await User.updateOne(
    { email },
    { $set: { loginAttempts: 0, lockedUntil: null } },
  );
  console.log(
    `Unlock ${email}: matched=${res.matchedCount} modified=${res.modifiedCount}`,
  );
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Unlock failed:", err.message);
  process.exit(1);
});
