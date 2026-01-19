import mongoose from "mongoose";
import { info, error as logError } from "../utils/logger.js";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (retryCount = 0) => {
  try {
    // Clean the connection string to remove any BOM or encoding issues
    let mongoUri = process.env.MONGO_URI || "";
    // Remove BOM characters and other encoding artifacts
    mongoUri = mongoUri.replace(/^\?o/g, "").replace(/\?\?$/g, "").trim();

    // Ensure it starts with mongodb:// or mongodb+srv://
    if (
      !mongoUri.startsWith("mongodb://") &&
      !mongoUri.startsWith("mongodb+srv://")
    ) {
      throw new Error("Invalid MongoDB connection string format");
    }

    // Connection options with pooling
    const options = {
      maxPoolSize: 50, // Maximum number of connections in the pool
      minPoolSize: 10, // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(mongoUri, options);

    info(`📦 MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      poolSize: options.maxPoolSize,
    });

    // Connection event listeners
    mongoose.connection.on("connected", () => {
      info("MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      logError("MongoDB connection error", { error: err.message });
    });

    mongoose.connection.on("disconnected", () => {
      logError("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      info("MongoDB connection closed due to app termination");
      process.exit(0);
    });
  } catch (err) {
    logError(`❌ MongoDB Connection Error: ${err.message}`, {
      error: err.message,
      retryCount,
    });

    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      info(`Retrying connection in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    } else {
      logError("Max retry attempts reached. Exiting...");
      process.exit(1);
    }
  }
};

export default connectDB;
