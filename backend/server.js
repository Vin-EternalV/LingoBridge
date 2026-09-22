// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const os = require("os");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const practiceRoutes = require("./routes/practice");
const aiRoutes = require("./routes/ai");
const progressRoutes = require("./routes/progress");
const adminRoutes = require("./routes/admin");
const superadminRoutes = require("./routes/superadmin");
const surveyRoutes = require("./routes/survey"); // NEW
const analyticsRoutes = require("./routes/analytics"); // NEW

dotenv.config();
connectDB();

const app = express();

app.use(helmet());

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      // In dev, allow everything (LAN testing, Expo, browser)
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check — used to verify reachability from another device
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LingoBridge API is alive",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superadminRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  const nets = os.networkInterfaces();
  const lanIPs = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) lanIPs.push(net.address);
    }
  }
  console.log(`\n🚀 LingoBridge API running on port ${PORT}`);
  console.log(`   Mode:    ${process.env.NODE_ENV || "development"}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  lanIPs.forEach((ip) => console.log(`   Network: http://${ip}:${PORT}`));
  console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
