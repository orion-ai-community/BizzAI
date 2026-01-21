import request from 'supertest';
import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setup.js';

beforeAll(async () => await connect(), 60000); // 60 second timeout for MongoDB setup
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Auth API', () => {
    it('should return 200 for root route', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });

    it.skip('should register a new user', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!', // Strong password
            phone: '1234567890',
            shopName: 'Test Shop'
        });

        // Depending on your actual auth controller logic, status might be 201 or 200
        expect([200, 201]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('token');
    });

    it.skip('should login a registered user', async () => {
        // Register first
        await request(app).post('/api/auth/register').send({
            username: 'loginuser',
            email: 'login@example.com',
            password: 'password123'
        });

        const res = await request(app).post('/api/auth/login').send({
            email: 'login@example.com',
            password: 'password123'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});
