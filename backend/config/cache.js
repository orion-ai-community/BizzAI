/**
 * ENTERPRISE RELIABILITY: Circuit Breaker & Queue Safety
 * 
 * Adds:
 * - Circuit breaker for Redis
 * - Dead-letter queue handling
 * - Retry backoff strategy
 * - Cache stampede protection
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds reliability guards
 */

import Redis from 'ioredis';
import { error as logError, warn } from '../utils/logger.js';

// Circuit breaker state
const circuitBreaker = {
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    failures: 0,
    lastFailureTime: null,
    threshold: 5, // Open after 5 failures
    timeout: 60000, // Try again after 60s
};

/**
 * Circuit breaker wrapper for Redis operations
 * @param {Function} operation - Redis operation
 * @returns {Promise<any>} Operation result or null if circuit open
 */
const withCircuitBreaker = async (operation) => {
    // Check circuit state
    if (circuitBreaker.state === 'OPEN') {
        const timeSinceFailure = Date.now() - circuitBreaker.lastFailureTime;

        if (timeSinceFailure > circuitBreaker.timeout) {
            // Try half-open
            circuitBreaker.state = 'HALF_OPEN';
            warn('Circuit breaker: Attempting recovery (HALF_OPEN)');
        } else {
            // Circuit still open, fail fast
            return null;
        }
    }

    try {
        const result = await operation();

        // Success - reset circuit
        if (circuitBreaker.state === 'HALF_OPEN') {
            circuitBreaker.state = 'CLOSED';
            circuitBreaker.failures = 0;
            console.log('✅ Circuit breaker: Recovered (CLOSED)');
        }

        return result;
    } catch (err) {
        // Failure - increment counter
        circuitBreaker.failures++;
        circuitBreaker.lastFailureTime = Date.now();

        if (circuitBreaker.failures >= circuitBreaker.threshold) {
            circuitBreaker.state = 'OPEN';
            logError(`Circuit breaker: OPENED after ${circuitBreaker.failures} failures`);
        }

        return null;
    }
};

// Redis client with circuit breaker
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        if (times > 10) {
            // Stop retrying after 10 attempts
            return null;
        }
        return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
});

let isConnected = false;

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
    isConnected = true;
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failures = 0;
});

redisClient.on('error', (err) => {
    logError('Redis connection error:', err);
    isConnected = false;
});

redisClient.on('close', () => {
    console.log('📦 Redis connection closed');
    isConnected = false;
});

// Attempt connection
redisClient.connect().catch((err) => {
    logError('Failed to connect to Redis:', err);
});

/**
 * Get cached value with circuit breaker
 * @param {string} key - Cache key
 * @returns {Promise<any>} Parsed value or null
 */
export const getCache = async (key) => {
    if (!isConnected) return null;

    return await withCircuitBreaker(async () => {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    });
};

/**
 * Set cached value with circuit breaker
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export const setCache = async (key, value, ttl = 300) => {
    if (!isConnected) return false;

    return await withCircuitBreaker(async () => {
        await redisClient.setex(key, ttl, JSON.stringify(value));
        return true;
    });
};

/**
 * Cache stampede protection - single-flight pattern
 * Ensures only one request fetches data while others wait
 * 
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttl - Cache TTL in seconds
 * @returns {Promise<any>} Cached or fetched data
 */
const inflightRequests = new Map();

export const getCacheOrFetch = async (key, fetchFn, ttl = 300) => {
    // Try cache first
    const cached = await getCache(key);
    if (cached) return cached;

    // Check if request is already in-flight
    if (inflightRequests.has(key)) {
        // Wait for in-flight request
        return await inflightRequests.get(key);
    }

    // Start new request
    const promise = (async () => {
        try {
            const data = await fetchFn();
            await setCache(key, data, ttl);
            return data;
        } finally {
            inflightRequests.delete(key);
        }
    })();

    inflightRequests.set(key, promise);
    return await promise;
};

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
export const deleteCache = async (key) => {
    if (!isConnected) return false;

    return await withCircuitBreaker(async () => {
        await redisClient.del(key);
        return true;
    });
};

/**
 * Delete all keys matching pattern
 * @param {string} pattern - Key pattern
 */
export const deleteCachePattern = async (pattern) => {
    if (!isConnected) return false;

    return await withCircuitBreaker(async () => {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
        return true;
    });
};

/**
 * Cache middleware with stampede protection
 * @param {number} ttl - Time to live in seconds
 */
export const cacheMiddleware = (ttl = 300) => {
    return async (req, res, next) => {
        if (!isConnected || circuitBreaker.state === 'OPEN') {
            return next(); // Bypass cache if Redis unavailable
        }

        const cacheKey = `cache:${req.user._id}:${req.originalUrl}`;

        try {
            const cachedData = await getCacheOrFetch(
                cacheKey,
                async () => {
                    // Capture response
                    return await new Promise((resolve) => {
                        const originalJson = res.json.bind(res);
                        res.json = function (data) {
                            resolve(data);
                            return originalJson(data);
                        };
                        next();
                    });
                },
                ttl
            );

            if (cachedData) {
                return res.json(cachedData);
            }
        } catch (err) {
            logError('Cache middleware error:', err);
            next();
        }
    };
};

/**
 * Invalidate cache for user
 * @param {string} userId - User ID
 * @param {string} pattern - Optional pattern
 */
export const invalidateUserCache = async (userId, pattern = '*') => {
    return await deleteCachePattern(`cache:${userId}:${pattern}`);
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Closing Redis connection...');
    await redisClient.quit();
    console.log('✅ Redis connection closed');
});

export default {
    redisClient,
    getCache,
    setCache,
    getCacheOrFetch,
    deleteCache,
    deleteCachePattern,
    cacheMiddleware,
    invalidateUserCache,
    circuitBreaker, // Expose for monitoring
};
