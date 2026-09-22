// config/db.js
const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not set. Copy backend/.env.example to backend/.env and configure it.",
      );
    }

    if (process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
      // ---- FIX for Windows querySrv EBADRESP / ECONNREFUSED ----
      // Node.js uses its own c-ares resolver which breaks SRV lookups
      // on some Windows networks. Force it to use public DNS servers.
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);

      // Prefer IPv4 results (avoids IPv6 timeouts on some networks)
      dns.setDefaultResultOrder("ipv4first");

      console.log("DNS servers for SRV lookup:", dns.getServers());
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "lingobridge",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (error.message.includes("Could not connect to any servers")) {
      console.error(
        "Atlas connection failed. Add this machine's public IP to Atlas Network Access: https://www.mongodb.com/docs/atlas/security-whitelist/",
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
