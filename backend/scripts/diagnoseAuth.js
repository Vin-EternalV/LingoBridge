// Run from backend/ with:  node scripts/diagnoseAuth.js
// Prints the actual stored state of the test accounts.
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");
const User = require("../models/User");

// Windows DNS resolvers sometimes return malformed SRV replies for Atlas.
// The backend's config/db.js does the same thing.
if (
  process.env.MONGODB_URI &&
  process.env.MONGODB_URI.startsWith("mongodb+srv://")
) {
  dns.setServers([process.env.MONGODB_DNS_SERVER || "1.1.1.1"]);
}

const EMAILS = [
  "learner@lingobridge.test",
  "admin@lingobridge.test",
  "superadmin@lingobridge.test",
];

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing in .env");

  console.log(
    "Connecting to:",
    process.env.MONGODB_URI.replace(/\/\/.*@/, "//***@"),
  );

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  for (const email of EMAILS) {
    // Must explicitly select the hidden fields or we won't see them.
    const user = await User.findOne({ email }).select(
      "+password +loginAttempts +lockedUntil +resetPasswordAttempts +resetPasswordLockedUntil",
    );

    if (!user) {
      console.log(`❌ ${email}  — NOT FOUND`);
      console.log("");
      continue;
    }

    console.log(`✅ ${email}`);
    console.log(`   id:              ${user._id}`);
    console.log(`   role:            ${user.role}`);
    console.log(`   isActive:        ${user.isActive}`);
    console.log(
      `   password hash:   ${user.password ? user.password.slice(0, 20) + "..." : "(none)"}`,
    );
    console.log(`   loginAttempts:   ${user.loginAttempts ?? "(default 0)"}`);
    console.log(`   lockedUntil:     ${user.lockedUntil ?? "(none)"}`);
    console.log(`   tokenVersion:    ${user.tokenVersion}`);

    // Try known passwords from the seed defaults
    const candidates = ["Learner123!", "Admin123!", "SuperAdmin123!"];
    let matched = null;
    for (const c of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await user.matchPassword(c)) {
        matched = c;
        break;
      }
    }
    console.log(
      `   matches one of seed passwords?  ${matched ? `YES → "${matched}"` : "NO"}`,
    );
    console.log("");
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error("Diagnose failed:", err.message);
  process.exit(1);
});
