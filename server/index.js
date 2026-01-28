const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/database");
const { basicLimiter, authLimiter } = require("./middleware/rateLimiter");
const seedAdmin = require("./utils/seeder");

const app = express();
const PORT = process.env.PORT || 3000;

/* ----------------------------------
   Trust Vercel proxy (IMPORTANT)
----------------------------------- */
app.set("trust proxy", 1);

/* ----------------------------------
   Serverless-safe DB + Seeder
----------------------------------- */
let dbReady = false;
let seedDone = false;

const ensureDbReady = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }

  if (!seedDone) {
    await seedAdmin(); // idempotent
    seedDone = true;
  }
};

/* ----------------------------------
   Global Middleware
----------------------------------- */
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? [process.env.FRONTEND_URL] : "*",
    credentials: true,
  }),
);

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------
   CORS image fix
----------------------------------- */
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

/* ----------------------------------
   Static uploads
----------------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ----------------------------------
   Ensure DB before handling requests
----------------------------------- */
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    console.error("❌ DB Init Error:", err);
    res.status(503).json({
      message: "Service temporarily unavailable",
    });
  }
});

/* ----------------------------------
   Rate Limiting (after DB)
----------------------------------- */
app.use(basicLimiter);
app.use("/api/auth", authLimiter);

/* ----------------------------------
   Routes
----------------------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/events", require("./routes/events"));
app.use("/api/rsvp", require("./routes/rsvp"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/showcase", require("./routes/showcase"));
app.use("/api/members", require("./routes/members"));

/* ----------------------------------
   Health & Root
----------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Enigma Backend API",
    version: "1.0.0",
    status: "Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ----------------------------------
   Error Handling
----------------------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

/* ----------------------------------
   404
----------------------------------- */
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ----------------------------------
   Local dev only
----------------------------------- */
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
