import winston from "winston";
import path from "path";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log format for console (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "bizzai-backend" },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // In production, use JSON format for console (for log aggregation)
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Enhanced logging functions with request context
 */
export const logEvent = (level, message, meta = {}) => {
  logger.log(level, message, meta);
};

export const info = (message, meta = {}) => {
  logger.info(message, meta);
};

export const warn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const error = (message, meta = {}) => {
  logger.error(message, meta);
};

export const debug = (message, meta = {}) => {
  logger.debug(message, meta);
};

/**
 * Log with request context (correlation ID)
 */
export const logWithContext = (req, level, message, meta = {}) => {
  const contextMeta = {
    ...meta,
    requestId: req.id || req.headers["x-request-id"],
    userId: req.user?._id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  };
  logger.log(level, message, contextMeta);
};

export default logger;
