/**
 * ENTERPRISE LOGIN SECURITY: Multi-Dimensional Rate Limiting
 * 
 * Implements layered brute-force protection:
 * - IP-based limiting
 * - Account-based limiting
 * - Device-based cooldowns
 * - Global spike detection
 * 
 * Redis-backed for distributed enforcement
 * Graceful degradation if Redis unavailable
 * 
 * NO AUTH FLOW CHANGES - Only adds security layers
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { error as logError, warn } from '../utils/logger.js';

// Redis client for distributed rate limiting
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 200);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false, // Don't queue commands when offline
});

let isRedisAvailable = false;

redisClient.on('connect', () => {
    console.log('✅ Redis connected (rate limiting)');
    isRedisAvailable = true;
});

redisClient.on('error', (err) => {
    // Suppress noisy Redis errors in logs - expected in CI/test environments
    if (process.env.NODE_ENV !== 'test') {
        logError('Redis error (rate limiting):', err.message);
    }
    isRedisAvailable = false;
});

// Attempt connection (non-blocking)
redisClient.connect().catch((err) => {
    if (process.env.NODE_ENV !== 'test') {
        warn('Redis unavailable - rate limiting will use in-memory fallback');
    }
});

// In-memory fallback store (per-instance only)
const memoryStore = new Map();

/**
 * Rate limiting thresholds (enterprise-grade)
 */
const LIMITS = {
    IP: {
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'rl:ip:',
    },
    ACCOUNT: {
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'rl:account:',
    },
    DEVICE: {
        max: 3,
        windowMs: 5 * 60 * 1000, // 5 minutes
        keyPrefix: 'rl:device:',
    },
    GLOBAL: {
        max: process.env.NODE_ENV === 'test' ? 1000 : 100, // Higher limit in tests to prevent interference
        windowMs: 60 * 1000, // 1 minute (spike detection)
        keyPrefix: 'rl:global:',
    },
};

/**
 * Hash identifier for privacy (account email)
 * @param {string} identifier - Email or account identifier
 * @returns {string} SHA-256 hash
 */
const hashIdentifier = (identifier) => {
    return crypto.createHash('sha256').update(identifier.toLowerCase()).digest('hex').substring(0, 16);
};

/**
 * Get rate limit state from Redis or memory
 * @param {string} key - Rate limit key
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} { count, resetAt }
 */
const getRateLimitState = async (key, windowMs) => {
    if (isRedisAvailable) {
        try {
            const data = await redisClient.get(key);
            if (!data) {
                return { count: 0, resetAt: Date.now() + windowMs };
            }

            const parsed = JSON.parse(data);
            return parsed;
        } catch (err) {
            logError('Redis get error:', err);
            isRedisAvailable = false;
        }
    }

    // Fallback to memory
    const data = memoryStore.get(key);
    if (!data || Date.now() > data.resetAt) {
        return { count: 0, resetAt: Date.now() + windowMs };
    }
    return data;
};

/**
 * Increment rate limit counter
 * @param {string} key - Rate limit key
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} Updated state
 */
const incrementRateLimit = async (key, windowMs) => {
    const state = await getRateLimitState(key, windowMs);

    // Reset if window expired
    if (Date.now() > state.resetAt) {
        state.count = 1;
        state.resetAt = Date.now() + windowMs;
    } else {
        state.count++;
    }

    if (isRedisAvailable) {
        try {
            const ttlSeconds = Math.ceil(windowMs / 1000);
            await redisClient.setex(key, ttlSeconds, JSON.stringify(state));
        } catch (err) {
            logError('Redis setex error:', err);
            isRedisAvailable = false;
        }
    }

    // Always update memory as fallback
    memoryStore.set(key, state);

    // Cleanup expired memory entries periodically
    if (Math.random() < 0.01) {
        const now = Date.now();
        for (const [k, v] of memoryStore.entries()) {
            if (now > v.resetAt + windowMs) {
                memoryStore.delete(k);
            }
        }
    }

    return state;
};

/**
 * Reset rate limit counter (on successful login)
 * @param {string} key - Rate limit key
 */
const resetRateLimit = async (key) => {
    if (isRedisAvailable) {
        try {
            await redisClient.del(key);
        } catch (err) {
            logError('Redis del error:', err);
        }
    }

    memoryStore.delete(key);
};

/**
 * Multi-dimensional login rate limiter
 * Enforces IP, account, device, and global limits
 * 
 * Usage: Apply BEFORE login controller
 * router.post('/login', loginRateLimiter, loginUser);
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const loginRateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const email = req.body.email;
        const deviceId = req.signedCookies?.deviceId || req.headers['x-device-id'] || 'unknown';
        const correlationId = req.correlationId || 'unknown';

        // 1. Global spike detection (prevent floods)
        const globalKey = LIMITS.GLOBAL.keyPrefix + 'login';
        const globalState = await incrementRateLimit(globalKey, LIMITS.GLOBAL.windowMs);

        if (globalState.count > LIMITS.GLOBAL.max) {
            logError('SECURITY: Global login spike detected', {
                count: globalState.count,
                max: LIMITS.GLOBAL.max,
                correlationId,
            });

            return res.status(429).json({
                message: 'Too many login attempts. Please try again later.',
                retryAfter: Math.ceil((globalState.resetAt - Date.now()) / 1000),
            });
        }

        // 2. IP-based limiting
        const ipKey = LIMITS.IP.keyPrefix + ip;
        const ipState = await getRateLimitState(ipKey, LIMITS.IP.windowMs);

        if (ipState.count >= LIMITS.IP.max) {
            warn('SECURITY: IP rate limit exceeded', {
                ip,
                count: ipState.count,
                correlationId,
            });

            return res.status(429).json({
                message: 'Too many login attempts from this IP. Please try again later.',
                retryAfter: Math.ceil((ipState.resetAt - Date.now()) / 1000),
            });
        }

        // 3. Account-based limiting (if email provided)
        if (email) {
            const accountHash = hashIdentifier(email);
            const accountKey = LIMITS.ACCOUNT.keyPrefix + accountHash;
            const accountState = await getRateLimitState(accountKey, LIMITS.ACCOUNT.windowMs);

            if (accountState.count >= LIMITS.ACCOUNT.max) {
                warn('SECURITY: Account rate limit exceeded', {
                    accountHash,
                    count: accountState.count,
                    correlationId,
                });

                // Log potential credential stuffing
                logError('SECURITY: Possible credential stuffing attack', {
                    accountHash,
                    ip,
                    attempts: accountState.count,
                    correlationId,
                });

                return res.status(429).json({
                    message: 'Too many failed login attempts for this account. Please try again later.',
                    retryAfter: Math.ceil((accountState.resetAt - Date.now()) / 1000),
                });
            }
        }

        // 4. Device-based limiting
        if (deviceId !== 'unknown') {
            const deviceKey = LIMITS.DEVICE.keyPrefix + deviceId;
            const deviceState = await getRateLimitState(deviceKey, LIMITS.DEVICE.windowMs);

            if (deviceState.count >= LIMITS.DEVICE.max) {
                warn('SECURITY: Device rate limit exceeded', {
                    deviceId: deviceId.substring(0, 8) + '...',
                    count: deviceState.count,
                    correlationId,
                });

                return res.status(429).json({
                    message: 'Too many login attempts from this device. Please try again later.',
                    retryAfter: Math.ceil((deviceState.resetAt - Date.now()) / 1000),
                });
            }
        }

        // Store rate limit context for post-login processing
        req.rateLimitContext = {
            ip,
            email,
            deviceId,
            ipKey,
            accountKey: email ? LIMITS.ACCOUNT.keyPrefix + hashIdentifier(email) : null,
            deviceKey: deviceId !== 'unknown' ? LIMITS.DEVICE.keyPrefix + deviceId : null,
        };

        next();
    } catch (err) {
        logError('Rate limiter error:', err);

        // Fail-safe: Allow request but log error
        if (process.env.NODE_ENV === 'production') {
            console.error('🚨 RATE LIMITER FAILURE - SECURITY DEGRADED');
        }

        next();
    }
};

/**
 * Post-login handler - increment or reset counters
 * Call from login controller after authentication
 * 
 * @param {Object} req - Express request
 * @param {boolean} success - Whether login succeeded
 */
export const handleLoginAttempt = async (req, success) => {
    if (!req.rateLimitContext) return;

    const { ipKey, accountKey, deviceKey, ip, email } = req.rateLimitContext;
    const correlationId = req.correlationId || 'unknown';

    if (success) {
        // Reset all counters on successful login
        await resetRateLimit(ipKey);
        if (accountKey) await resetRateLimit(accountKey);
        if (deviceKey) await resetRateLimit(deviceKey);

        console.log('✅ Login successful - rate limit counters reset', {
            ip,
            accountHash: accountKey ? accountKey.split(':')[2] : null,
            correlationId,
        });
    } else {
        // Increment counters on failed login
        await incrementRateLimit(ipKey, LIMITS.IP.windowMs);
        if (accountKey) await incrementRateLimit(accountKey, LIMITS.ACCOUNT.windowMs);
        if (deviceKey) await incrementRateLimit(deviceKey, LIMITS.DEVICE.windowMs);

        // Log failed attempt
        warn('SECURITY: Login attempt failed', {
            ip,
            accountHash: accountKey ? accountKey.split(':')[2] : null,
            correlationId,
        });

        // Attack signal detection
        await detectAttackSignals(req);
    }
};

/**
 * Attack signal detection (non-blocking, log-only)
 * Detects patterns indicating coordinated attacks
 * 
 * @param {Object} req - Express request
 */
const detectAttackSignals = async (req) => {
    const { email, ip } = req.rateLimitContext;
    const correlationId = req.correlationId || 'unknown';

    if (!email) return;

    const accountHash = hashIdentifier(email);

    // Check for distributed attack (same account, many IPs)
    const distributedKey = `attack:distributed:${accountHash}`;

    if (isRedisAvailable) {
        try {
            const ipSet = await redisClient.sadd(distributedKey, ip);
            await redisClient.expire(distributedKey, 3600); // 1 hour

            const uniqueIPs = await redisClient.scard(distributedKey);

            if (uniqueIPs >= 5) {
                logError('🚨 SECURITY ALERT: Distributed brute-force attack detected', {
                    accountHash,
                    uniqueIPs,
                    correlationId,
                    attackType: 'distributed_brute_force',
                });
            }
        } catch (err) {
            logError('Attack detection error:', err);
        }
    }

    // Check for credential stuffing (same password across accounts)
    // Note: We don't have password here, but we can detect velocity
    const velocityKey = `attack:velocity:${ip}`;

    if (isRedisAvailable) {
        try {
            const attempts = await redisClient.incr(velocityKey);
            await redisClient.expire(velocityKey, 60); // 1 minute

            if (attempts >= 10) {
                logError('🚨 SECURITY ALERT: High-velocity login attempts detected', {
                    ip,
                    attempts,
                    correlationId,
                    attackType: 'credential_stuffing_suspected',
                });
            }
        } catch (err) {
            logError('Velocity detection error:', err);
        }
    }
};

/**
 * Legacy rate limiters (kept for backward compatibility)
 * These are now superseded by loginRateLimiter
 */
export const authLimiter = loginRateLimiter; // Alias for backward compatibility

export const passwordResetLimiter = async (req, res, next) => {
    // Simple IP-based limiting for password reset
    const ip = req.ip || req.connection.remoteAddress;
    const key = 'rl:pwreset:' + ip;

    const state = await getRateLimitState(key, 60 * 60 * 1000); // 1 hour

    if (state.count >= 3) {
        return res.status(429).json({
            message: 'Too many password reset requests. Please try again later.',
            retryAfter: Math.ceil((state.resetAt - Date.now()) / 1000),
        });
    }

    await incrementRateLimit(key, 60 * 60 * 1000);
    next();
};

export const forceLogoutLimiter = async (req, res, next) => {
    // Account-based limiting for force logout
    const userId = req.user?._id?.toString();
    if (!userId) return next();

    const key = 'rl:logout:' + userId;
    const state = await getRateLimitState(key, 60 * 60 * 1000); // 1 hour

    if (state.count >= 5) {
        return res.status(429).json({
            message: 'Too many logout requests. Please try again later.',
            retryAfter: Math.ceil((state.resetAt - Date.now()) / 1000),
        });
    }

    await incrementRateLimit(key, 60 * 60 * 1000);
    next();
};

/**
 * Test helper: Clear rate limit keys safely
 * @param {string} pattern - Key pattern to clear (default: 'rl:*')
 */
export const clearRateLimitKeys = async (pattern = 'rl:*') => {
    try {
        const keys = await redisClient.keys(pattern);
        if (Array.isArray(keys) && keys.length > 0) {
            await redisClient.del(...keys);
        }
    } catch (err) {
        // Ignore errors - Redis may be unavailable in tests
    }
};

/**
 * Test helper: Clear in-memory rate limit counters
 * Use this in tests to reset the in-memory fallback store
 */
export const clearInMemoryCounters = () => {
    memoryStore.clear();
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Closing Redis connection (rate limiter)...');
    await redisClient.quit();
});

// Named export for redisClient (required by tests)
export { redisClient };

// Default export for backward compatibility
export default {
    loginRateLimiter,
    handleLoginAttempt,
    authLimiter,
    passwordResetLimiter,
    forceLogoutLimiter,
    redisClient,
    clearRateLimitKeys,
    isRedisAvailable: () => isRedisAvailable,
};
