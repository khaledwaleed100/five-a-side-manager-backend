import { describe, it, expect } from '@jest/globals';
import { rankCandidates, pickWinner, serializePoll } from '../services/pollService.js';

const stat = (playerId, goals, assists, matchRating) => ({ playerId, goals, assists, matchRating });

describe('pollService — rankCandidates', () => {
    it('averages ratings across matches and sorts best first', () => {
        const matches = [
            { playerStats: [stat('a', 2, 0, 8), stat('b', 0, 1, 6.5)] },
            { playerStats: [stat('a', 1, 1, 7.3), stat('b', 0, 0, 6)] },
            { playerStats: [stat('c', 3, 0, 9)] }
        ];
        const ranked = rankCandidates(matches, 5);
        expect(ranked.map(r => r.playerId)).toEqual(['c', 'a', 'b']);
        expect(ranked[1]).toMatchObject({ playerId: 'a', avgRating: 7.7, goals: 3, assists: 1, matches: 2 });
    });

    it('limits the number of candidates', () => {
        const matches = [{ playerStats: ['a', 'b', 'c', 'd'].map((id, i) => stat(id, 0, 0, 6 + i)) }];
        expect(rankCandidates(matches, 2)).toHaveLength(2);
    });

    it('breaks rating ties with goal contributions', () => {
        const matches = [{ playerStats: [stat('a', 0, 0, 7), stat('b', 1, 1, 7)] }];
        expect(rankCandidates(matches, 5)[0].playerId).toBe('b');
    });
});

const buildPoll = (votes) => ({
    _id: 'poll1',
    userId: 'manager',
    title: 'Player of the Week',
    type: 'weekly',
    isActive: true,
    createdAt: new Date(),
    closedAt: null,
    winner: null,
    candidates: [
        { _id: 'a', name: 'Ali', position: 'FWD', overallRating: 80 },
        { _id: 'b', name: 'Bob', position: 'DEF', overallRating: 70 }
    ],
    candidateStats: [
        { playerId: 'a', avgRating: 7.5, goals: 3, assists: 1, matches: 3 },
        { playerId: 'b', avgRating: 8.0, goals: 0, assists: 2, matches: 3 }
    ],
    votes
});

describe('pollService — pickWinner', () => {
    it('returns the player with the most votes', () => {
        const poll = buildPoll([
            { userId: 'u1', playerId: 'a' }, { userId: 'u2', playerId: 'a' }, { userId: 'u3', playerId: 'b' }
        ]);
        expect(pickWinner(poll)).toBe('a');
    });

    it('breaks vote ties with the higher average rating', () => {
        const poll = buildPoll([{ userId: 'u1', playerId: 'a' }, { userId: 'u2', playerId: 'b' }]);
        expect(pickWinner(poll)).toBe('b');
    });

    it('returns null when nobody voted', () => {
        expect(pickWinner(buildPoll([]))).toBeNull();
    });
});

describe('pollService — serializePoll', () => {
    it('reports vote percentages and the viewer\'s own vote without leaking voter ids', () => {
        const poll = buildPoll([
            { userId: 'u1', playerId: 'a' }, { userId: 'u2', playerId: 'a' },
            { userId: 'u3', playerId: 'a' }, { userId: 'u4', playerId: 'b' }
        ]);
        const out = serializePoll(poll, 'u4');
        expect(out.totalVotes).toBe(4);
        expect(out.hasVoted).toBe(true);
        expect(out.myVote).toBe('b');
        expect(out.isOwner).toBe(false);
        expect(out.candidates.find(c => c._id === 'a')).toMatchObject({ votes: 3, percent: 75 });
        expect(JSON.stringify(out)).not.toContain('u1');
    });

    it('flags the creator as owner and a non-voter as not voted', () => {
        const out = serializePoll(buildPoll([]), 'manager');
        expect(out.isOwner).toBe(true);
        expect(out.hasVoted).toBe(false);
        expect(out.candidates.every(c => c.percent === 0)).toBe(true);
    });
});
