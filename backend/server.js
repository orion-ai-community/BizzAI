import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import { validateEnv } from "./config/validateEnv.js";
import { info, error } from "./utils/logger.js";

dotenv.config();

// =======================
// Environment Validation
// =======================
info("Validating environment variables...");
validateEnv();

// =======================
// DB
// =======================
connectDB();

// =======================
// Server
// =======================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  info(`Server running on port ${PORT}`)
);

// =======================
// Graceful Shutdown
// =======================
const gracefulShutdown = (signal) => {
  info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    info("HTTP server closed");

    // Close database connections
    import("mongoose").then((mongoose) => {
      mongoose.default.connection.close(false, () => {
        info("MongoDB connection closed");
        process.exit(0);
      });
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
