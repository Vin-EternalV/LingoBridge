// test-db.js  — run with: node test-db.js
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");

if (process.env.MONGODB_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);
  dns.setDefaultResultOrder("ipv4first");
}

(async () => {
  try {
    console.log(
      "Connecting to:",
      process.env.MONGODB_URI?.replace(/:[^:@]+@/, ":****@"),
    );

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "lingobridge",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Connected. Host:", mongoose.connection.host);
    console.log("   DB name:", mongoose.connection.name);

    const Test = mongoose.model(
      "Test",
      new mongoose.Schema({ msg: String, at: Date }),
    );

    const doc = await Test.create({
      msg: "hello from test-db",
      at: new Date(),
    });
    console.log("✅ Inserted:", doc._id);

    const count = await Test.countDocuments();
    console.log("✅ Total docs in 'tests' collection:", count);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("❌ FAILED:", e.message);
    process.exit(1);
  }
})();
