import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Validates that all required environment variables are set
 * Fails fast with clear error messages if any are missing
 */
export const validateEnv = () => {
  const required = {
    // Server
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    
    // Database
    MONGO_URI: process.env.MONGO_URI,
    
    // Security
    JWT_SECRET: process.env.JWT_SECRET,
    
    // Email (optional in development)
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
  };

  const optional = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };

  const errors = [];
  const warnings = [];

  // Validate required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === "") {
      // Email vars are optional in development
      if (key.startsWith("EMAIL_") && process.env.NODE_ENV === "development") {
        warnings.push(`⚠️  ${key} is not set (email features will be disabled)`);
        continue;
      }
      errors.push(`❌ ${key} is required but not set`);
    }
  }

  // Validate NODE_ENV
  const validEnvs = ["development", "production", "test"];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(
      `❌ NODE_ENV must be one of: ${validEnvs.join(", ")} (got: ${process.env.NODE_ENV})`
    );
  }

  // Validate MONGO_URI format
  if (
    process.env.MONGO_URI &&
    !process.env.MONGO_URI.startsWith("mongodb://") &&
    !process.env.MONGO_URI.startsWith("mongodb+srv://")
  ) {
    errors.push(
      `❌ MONGO_URI must start with mongodb:// or mongodb+srv:// (got: ${process.env.MONGO_URI.substring(0, 20)}...)`
    );
  }

  // Validate JWT_SECRET strength (production only)
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push(
        `❌ JWT_SECRET must be at least 32 characters in production (got: ${process.env.JWT_SECRET.length} characters)`
      );
    }
    if (process.env.JWT_SECRET.includes("dev") || process.env.JWT_SECRET.includes("example")) {
      errors.push(
        `❌ JWT_SECRET appears to be a development/example secret. Use a strong random secret in production.`
      );
    }
  }

  // Warn about optional variables
  for (const [key, value] of Object.entries(optional)) {
    if (!value || value.trim() === "") {
      warnings.push(`⚠️  ${key} is not set (optional)`);
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log("\n⚠️  Environment Warnings:");
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  // If errors, fail fast
  if (errors.length > 0) {
    console.error("\n❌ Environment Validation Failed:\n");
    errors.forEach((error) => console.error(`   ${error}`));
    console.error("\n💡 Tip: Copy .env.example to .env and fill in the values\n");
    process.exit(1);
  }

  console.log("✅ Environment validation passed");
};

/**
 * Get validated environment variables with defaults
 */
export const getEnv = () => {
  return {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    sentryDsn: process.env.SENTRY_DSN,
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
  };
};

export default { validateEnv, getEnv };
