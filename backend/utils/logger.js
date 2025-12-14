import fs from "fs";
import path from "path";

/**
 * Logs messages to console + file (daily)
 */
export const logEvent = (level, message) => {
  const logDir = path.join("logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const date = new Date().toISOString();
  const filePath = path.join(logDir, `${new Date().toISOString().split("T")[0]}.log`);
  const logLine = `[${date}] [${level.toUpperCase()}] ${message}\n`;

  fs.appendFileSync(filePath, logLine);
  console.log(logLine.trim());
};

// Shorthand wrappers
export const info = (msg) => logEvent("info", msg);
export const warn = (msg) => logEvent("warn", msg);
export const error = (msg) => logEvent("error", msg);
