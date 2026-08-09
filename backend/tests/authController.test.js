import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Auth — Register', () => {
    it('should register a new user with valid data', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@test.com',
                password: 'password123',
                securityQuestion: 'What is your pet name?',
                securityAnswer: 'buddy'
            });
        expect(res.status).toBe(201);
        expect(res.body.email).toBe('test@test.com');
        expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for duplicate email', async () => {
        const data = {
            email: 'dup@test.com',
            password: 'password123',
            securityQuestion: 'Q?',
            securityAnswer: 'A'
        };
        await request(app).post('/api/auth/register').send(data);
        const res = await request(app).post('/api/auth/register').send(data);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'missing@test.com' });
        expect(res.status).toBe(400);
    });
});

describe('Auth — Login', () => {
    beforeEach(async () => {
        await request(app).post('/api/auth/register').send({
            email: 'login@test.com',
            password: 'mypassword',
            securityQuestion: 'Q?',
            securityAnswer: 'A'
        });
    });

    it('should login with correct credentials and return accessToken', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'mypassword' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'wrongpass' });
        expect(res.status).toBe(401);
    });

    it('should return 401 when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'somepass' });
        expect(res.status).toBe(401);
    });
});
