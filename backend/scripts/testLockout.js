// Manual lockout test. Run from backend/ with:
//   node scripts/testLockout.js
require("dotenv").config();
const https = require("https");
const http = require("http");

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";
const EMAIL = process.env.TEST_EMAIL || "learner@lingobridge.test";
const WRONG = "wrongpassword";
const RIGHT = process.env.TEST_PASSWORD || "Learner123!";

const post = (path, body) =>
  new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const lib = url.protocol === "https:" ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(chunks) });
          } catch {
            resolve({ status: res.statusCode, body: chunks });
          }
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });

(async () => {
  console.log(`Testing lockout for ${EMAIL} at ${BASE}\n`);

  console.log("--- 5 wrong-password attempts ---");
  for (let i = 1; i <= 5; i++) {
    const r = await post("/api/auth/login", { email: EMAIL, password: WRONG });
    console.log(
      `Attempt ${i}: status ${r.status} → ${r.body.message || JSON.stringify(r.body)}`,
    );
  }

  console.log("\n--- Now trying the CORRECT password ---");
  const r = await post("/api/auth/login", { email: EMAIL, password: RIGHT });
  console.log(
    `status ${r.status} → ${r.body.message || "logged in (unexpected!)"}`,
  );

  if (r.status === 429) {
    console.log("\n✅ Lockout works.");
  } else if (r.status === 200) {
    console.log(
      '\n❌ Lockout did NOT trigger. Check that login() uses .select("+lockedUntil +loginAttempts").',
    );
  } else {
    console.log("\n⚠️  Unexpected response. See above.");
  }

  console.log("\nTo unlock manually:  node scripts/unlockUser.js");
})();
