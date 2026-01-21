/**
 * ENTERPRISE LOGIN SECURITY: Comprehensive Test Suite
 * 
 * Tests multi-dimensional rate limiting, attack detection, and fail-safe behavior
 * Backend-only tests - NO UI tests
 */

import request from 'supertest';
import app from '../app.js';
import { redisClient, handleLoginAttempt } from '../middlewares/rateLimiter.js';
import User from '../models/User.js';

describe('Enterprise Login Security', () => {
    let testUser;

    beforeAll(async () => {
        // Create test user
        testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'ValidPassword123!',
        });
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteOne({ email: 'test@example.com' });
        await redisClient.quit();
    });

    beforeEach(async () => {
        // Clear Redis rate limit keys before each test
        const keys = await redisClient.keys('rl:*');
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    });

    describe('1. IP-Based Rate Limiting', () => {
        it('should allow 5 attempts from same IP', async () => {
            for (let i = 0; i < 5; i++) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });

                expect(res.status).not.toBe(429);
            }
        });

        it('should block 6th attempt from same IP', async () => {
            // Make 5 failed attempts
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // 6th attempt should be blocked
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many login attempts from this IP');
            expect(res.body.retryAfter).toBeGreaterThan(0);
        });
    });

    describe('2. Account-Based Rate Limiting', () => {
        it('should block same account from different IPs', async () => {
            // Simulate 5 failed attempts from different IPs
            for (let i = 0; i < 5; i++) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .set('X-Forwarded-For', `192.168.1.${i}`)
                    .send({ email: 'test@example.com', password: 'wrong' });

                expect(res.status).not.toBe(429);
            }

            // 6th attempt from new IP should be blocked (account limit)
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Forwarded-For', '192.168.1.100')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many failed login attempts for this account');
        });
    });

    describe('3. Device-Based Rate Limiting', () => {
        it('should limit attempts from same device', async () => {
            const deviceId = 'test-device-123';

            // Make 3 failed attempts with same device ID
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .set('X-Device-ID', deviceId)
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // 4th attempt should be blocked
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Device-ID', deviceId)
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many login attempts from this device');
        });
    });

    describe('4. Global Spike Detection', () => {
        it('should detect and block global login floods', async () => {
            // Simulate 100+ login attempts in 1 minute
            const promises = [];
            for (let i = 0; i < 105; i++) {
                promises.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({ email: `user${i}@example.com`, password: 'wrong' })
                );
            }

            const results = await Promise.all(promises);
            const blocked = results.filter(r => r.status === 429);

            expect(blocked.length).toBeGreaterThan(0);
            expect(blocked[0].body.message).toContain('Too many login attempts');
        });
    });

    describe('5. Counter Reset on Success', () => {
        it('should reset all counters on successful login', async () => {
            // Make 4 failed attempts
            for (let i = 0; i < 4; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // Successful login should reset counters
            const successRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'ValidPassword123!' });

            expect(successRes.status).toBe(200);

            // Next 5 attempts should be allowed (counters reset)
            for (let i = 0; i < 5; i++) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });

                expect(res.status).not.toBe(429);
            }
        });
    });

    describe('6. Distributed Attack Detection', () => {
        it('should detect distributed brute-force attack', async () => {
            // Simulate same account from 5+ different IPs
            for (let i = 0; i < 6; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .set('X-Forwarded-For', `10.0.0.${i}`)
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // Check Redis for attack signal
            const attackKey = 'attack:distributed:' +
                require('crypto').createHash('sha256')
                    .update('test@example.com')
                    .digest('hex')
                    .substring(0, 16);

            const uniqueIPs = await redisClient.scard(attackKey);
            expect(uniqueIPs).toBeGreaterThanOrEqual(5);
        });
    });

    describe('7. Cooldown Expiry', () => {
        it('should allow login after cooldown expires', async () => {
            // Block account
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // Verify blocked
            let res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(429);

            // Fast-forward time by clearing Redis keys (simulates expiry)
            const keys = await redisClient.keys('rl:account:*');
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }

            // Should be allowed now
            res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).not.toBe(429);
        });
    });

    describe('8. Redis Outage Behavior', () => {
        it('should fail-safe when Redis is unavailable', async () => {
            // Disconnect Redis
            await redisClient.disconnect();

            // Login should still work (in-memory fallback)
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'ValidPassword123!' });

            expect(res.status).toBe(200);

            // Reconnect Redis
            await redisClient.connect();
        });

        it('should use in-memory fallback when Redis fails', async () => {
            // Simulate Redis error by disconnecting
            await redisClient.disconnect();

            // Make 5 failed attempts (should use in-memory store)
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test2@example.com', password: 'wrong' });
            }

            // 6th attempt should be blocked (in-memory limit)
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test2@example.com', password: 'wrong' });

            expect(res.status).toBe(429);

            // Reconnect Redis
            await redisClient.connect();
        });
    });

    describe('9. Credential Stuffing Detection', () => {
        it('should detect high-velocity attempts from same IP', async () => {
            // Simulate 10+ rapid attempts from same IP
            const promises = [];
            for (let i = 0; i < 12; i++) {
                promises.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({ email: `victim${i}@example.com`, password: 'CommonPassword123' })
                );
            }

            await Promise.all(promises);

            // Check for velocity attack signal in Redis
            const velocityKey = 'attack:velocity:' + '::1'; // Default IP in tests
            const attempts = await redisClient.get(velocityKey);

            expect(parseInt(attempts)).toBeGreaterThanOrEqual(10);
        });
    });

    describe('10. Response Consistency', () => {
        it('should return same response shape when rate limited', async () => {
            // Block account
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // Get rate-limited response
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(res.status).toBe(429);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('retryAfter');
            expect(typeof res.body.retryAfter).toBe('number');
        });
    });
});
