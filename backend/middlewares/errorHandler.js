const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log full error server-side with stack trace
    console.error(`[Error] ${status} - ${message}`);
    if (err.stack) {
        console.error(err.stack);
    }

    // CRITICAL: NEVER send stack traces or detailed errors to client
    // Even in development, use generic messages for security
    const isProduction = process.env.NODE_ENV === "production";

    res.status(status).json({
        success: false,
        status,
        message: isProduction
            ? "An error occurred. Please try again later."
            : message, // In dev, show message but never stack
        // Stack trace NEVER sent to client
    });
};

export default errorHandler;
