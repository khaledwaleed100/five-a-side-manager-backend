import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Player from '../models/Player.js';

let mongoServer;
let accessToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await request(app).post('/api/auth/register').send({
        email: 'match-test@test.com',
        password: 'test1234',
        securityQuestion: 'Q?',
        securityAnswer: 'A'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
        email: 'match-test@test.com',
        password: 'test1234'
    });
    accessToken = loginRes.body.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Match.deleteMany({});
});

describe('Match — Create', () => {
    it('should create a match with valid data', async () => {
        const res = await request(app)
            .post('/api/matches')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ place: 'The Cage', date: '2026-09-15', time: '18:00' });
        expect(res.status).toBe(201);
        expect(res.body.match.place).toBe('The Cage');
    });

    it('should return 400 when place is missing', async () => {
        const res = await request(app)
            .post('/api/matches')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ date: '2026-09-15', time: '18:00' });
        expect(res.status).toBe(400);
    });
});

describe('Match — Generate Teams', () => {
    it('should return 400 when roster has fewer than 2 players', async () => {
        const createRes = await request(app)
            .post('/api/matches')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ place: 'Test Ground', date: '2026-09-16', time: '19:00' });
        const matchId = createRes.body.match._id;

        const genRes = await request(app)
            .post(`/api/matches/${matchId}/generate`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(genRes.status).toBe(400);
        expect(genRes.body.message).toMatch(/at least 2 players/i);
    });
});

describe('Match — Complete', () => {
    it('should not allow completing an already completed match', async () => {
        const createRes = await request(app)
            .post('/api/matches')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ place: 'Arena', date: '2026-09-17', time: '20:00' });
        const matchId = createRes.body.match._id;

        // Complete once
        await request(app)
            .post(`/api/matches/${matchId}/complete`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ finalScore: { teamA: 3, teamB: 2 }, playerStats: [] });

        // Complete again — should fail
        const res = await request(app)
            .post(`/api/matches/${matchId}/complete`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ finalScore: { teamA: 1, teamB: 0 }, playerStats: [] });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already completed/i);
    });
});
