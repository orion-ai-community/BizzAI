import { v4 as uuidv4 } from "uuid";

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
export const requestId = (req, res, next) => {
    // Use existing request ID from header or generate new one
    const id = req.headers["x-request-id"] || uuidv4();

    // Attach to request object
    req.id = id;

    // Add to response headers
    res.setHeader("X-Request-ID", id);

    next();
};

export default requestId;
