import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import Player from '../models/Player.js';

let mongoServer;
let accessToken;
let userId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Register + login to get auth token
    await request(app).post('/api/auth/register').send({
        email: 'player-test@test.com',
        password: 'test1234',
        securityQuestion: 'Q?',
        securityAnswer: 'A'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
        email: 'player-test@test.com',
        password: 'test1234'
    });
    accessToken = loginRes.body.accessToken;
    userId = loginRes.body._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Player.deleteMany({});
});

describe('Player — CRUD', () => {
    it('should create a player with valid data', async () => {
        const res = await request(app)
            .post('/api/players')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Ahmed',
                position: 'FWD',
                attributes: {
                    speed: 80, shooting: 85, passing: 70,
                    defending: 40, physical: 75, stamina: 80,
                    goalkeeping: 30, positioning: 80, longPass: 65, shortPass: 75
                }
            });
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Ahmed');
        expect(res.body.overallRating).toBeGreaterThan(0);
    });

    it('should return 400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/players')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ position: 'MID' });
        expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
        const res = await request(app).get('/api/players');
        expect(res.status).toBe(401);
    });

    it('should delete a player the user owns', async () => {
        const createRes = await request(app)
            .post('/api/players')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Delete Me', position: 'DEF', attributes: {} });
        const id = createRes.body._id;

        const deleteRes = await request(app)
            .delete(`/api/players/${id}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.id).toBe(id);
    });
});

describe('Player — Auth Middleware', () => {
    it('should reject expired/invalid token with 401', async () => {
        const res = await request(app)
            .get('/api/players')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(401);
    });
});
