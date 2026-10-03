import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

/**
 * End-to-end poll flow against an in-memory MongoDB:
 * manager completes 3 matches -> starts poll -> friends vote (once, atomically) -> manager closes.
 * Env is prepared first and the app imported dynamically, because server.js connects on import.
 */
let mongoServer;
let app;
let Player, Match;
const tokens = {};
const ids = {};

const auth = (who) => ({ Authorization: `Bearer ${tokens[who]}` });

const signUp = async (email, key) => {
    await request(app).post('/api/auth/register').send({
        email, password: 'test1234', name: key, securityQuestion: 'Q?', securityAnswer: 'A'
    });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'test1234' });
    tokens[key] = res.body.accessToken;
    ids[key] = res.body._id;
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    process.env.PORT = '0';

    app = (await import('../server.js')).default;
    Player = (await import('../models/Player.js')).default;
    Match = (await import('../models/Match.js')).default;

    await signUp('manager@poll.test', 'manager');
    await signUp('voter1@poll.test', 'voter1');
    await signUp('voter2@poll.test', 'voter2');

    const mk = (name, position) => Player.create({ userId: ids.manager, name, position });
    const [ali, bob, cem] = await Promise.all([mk('Ali', 'FWD'), mk('Bob', 'MID'), mk('Cem', 'DEF')]);
    ids.ali = ali._id.toString(); ids.bob = bob._id.toString(); ids.cem = cem._id.toString();

    for (let d = 1; d <= 3; d++) {
        await Match.create({
            userId: ids.manager, place: 'Cage', date: new Date(2026, 8, d), time: '18:00', status: 'completed',
            playerStats: [
                { playerId: ali._id, goals: 2, assists: 0, matchRating: 7.6 },
                { playerId: bob._id, goals: 0, assists: 1, matchRating: 6.5 },
                { playerId: cem._id, goals: 0, assists: 0, matchRating: 6.0 }
            ]
        });
    }
}, 120000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
});

describe('Polls API', () => {
    it('requires login', async () => {
        const res = await request(app).get('/api/polls');
        expect(res.status).toBe(401);
    });

    it('reports the manager as ready and a voter-only account as not', async () => {
        const mine = await request(app).get('/api/polls/status').set(auth('manager'));
        expect(mine.body.weekly).toMatchObject({ required: 3, completed: 3, canGenerate: true });
        expect(mine.body.monthly.canGenerate).toBe(false);

        const theirs = await request(app).get('/api/polls/status').set(auth('voter1'));
        expect(theirs.body.weekly).toMatchObject({ completed: 0, canGenerate: false });
    });

    it('refuses to build a poll without enough matches', async () => {
        const res = await request(app).post('/api/polls/generate').set(auth('voter1')).send({ type: 'weekly' });
        expect(res.status).toBe(400);
    });

    let pollId;
    it('builds a weekly poll ranked by rating, and blocks a duplicate', async () => {
        const res = await request(app).post('/api/polls/generate').set(auth('manager')).send({ type: 'weekly' });
        expect(res.status).toBe(201);
        pollId = res.body._id;
        expect(res.body.isOwner).toBe(true);
        expect(res.body.candidates.map(c => c.name)).toEqual(['Ali', 'Bob', 'Cem']);
        expect(res.body.candidates[0].avgRating).toBe(7.6);

        const dup = await request(app).post('/api/polls/generate').set(auth('manager')).send({ type: 'weekly' });
        expect(dup.status).toBe(409);
    });

    it('shows the poll to voters without leaking who voted', async () => {
        const res = await request(app).get('/api/polls').set(auth('voter1'));
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ isOwner: false, hasVoted: false, totalVotes: 0 });
    });

    it('records a vote once and rejects the second', async () => {
        const first = await request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter1')).send({ playerId: ids.bob });
        expect(first.status).toBe(200);
        expect(first.body).toMatchObject({ hasVoted: true, myVote: ids.bob, totalVotes: 1 });
        expect(first.body.candidates.find(c => c.name === 'Bob').percent).toBe(100);

        const second = await request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter1')).send({ playerId: ids.ali });
        expect(second.status).toBe(409);
    });

    it('rejects non-candidates and malformed ids', async () => {
        const bad = await request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter2')).send({ playerId: 'nope' });
        expect(bad.status).toBe(400);
        const stranger = await request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter2'))
            .send({ playerId: new mongoose.Types.ObjectId().toString() });
        expect(stranger.status).toBe(400);
    });

    it('lets only one of two simultaneous votes from the same user through', async () => {
        const [a, b] = await Promise.all([
            request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter2')).send({ playerId: ids.ali }),
            request(app).post(`/api/polls/${pollId}/vote`).set(auth('voter2')).send({ playerId: ids.ali })
        ]);
        expect([a.status, b.status].sort()).toEqual([200, 409]);
        const list = await request(app).get('/api/polls').set(auth('manager'));
        expect(list.body[0].totalVotes).toBe(2);
    });

    it('only lets the creator close it, then crowns the winner', async () => {
        const denied = await request(app).post(`/api/polls/${pollId}/close`).set(auth('voter1'));
        expect(denied.status).toBe(403);

        const closed = await request(app).post(`/api/polls/${pollId}/close`).set(auth('manager'));
        expect(closed.status).toBe(200);
        expect(closed.body.isActive).toBe(false);
        // 1 vote each; tie broken by the higher average rating -> Ali
        expect(closed.body.winnerId).toBe(ids.ali);

        const late = await request(app).post(`/api/polls/${pollId}/vote`).set(auth('manager')).send({ playerId: ids.cem });
        expect(late.status).toBe(400);
    });

    it('does not reuse the same 3 matches for the next weekly poll', async () => {
        const status = await request(app).get('/api/polls/status').set(auth('manager'));
        expect(status.body.weekly).toMatchObject({ pending: 0, canGenerate: false });
    });
});
