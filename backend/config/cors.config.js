/**
 * Enhanced CORS configuration for production
 */

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];

// Add production origins from environment
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add additional allowed origins from environment (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    allowedOrigins.push(...additionalOrigins);
}

/**
 * Check if origin is allowed
 */
const isAllowedOrigin = (origin) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return true;

    // In development, allow any localhost
    if (
        process.env.NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
    ) {
        return true;
    }

    // Check against whitelist
    return allowedOrigins.includes(origin);
};

/**
 * CORS options with enhanced security
 */
export const corsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error(`CORS not allowed from origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
};

export default { corsOptions, isAllowedOrigin };
