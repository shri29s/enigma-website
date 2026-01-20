const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/database");
const { basicLimiter, authLimiter } = require("./middleware/rateLimiter");
const seedAdmin = require("./utils/seeder");
require("dotenv").config();

// Connect to MongoDB
connectDB().then(() => {
  // 🚀 Seed admin after DB connection is successful
  seedAdmin();
});

const app = express();
const PORT = process.env.PORT || 3000;

// General Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL, "https://your-frontend.vercel.app"]
        : "*",
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware to set Cross-Origin-Resource-Policy header
// This helps prevent browsers from blocking image loads
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Static file serving for the 'uploads' folder
// This line MUST be here for your images to be accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting middleware
app.use(basicLimiter);
app.use("/api/auth", authLimiter);

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/events", require("./routes/events"));
app.use("/api/rsvp", require("./routes/rsvp"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/showcase", require("./routes/showcase"));
app.use("/api/members", require("./routes/members"));

// Health check and root routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler for any routes not matched
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
