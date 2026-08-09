import { describe, it, expect } from '@jest/globals';
import { balanceTeams } from '../services/balancingService.js';

const makePlayer = (id, position, overall) => ({
    _id: id,
    position,
    overallRating: overall,
    attributes: {
        speed: 50, shooting: 50, passing: 50, defending: overall,
        physical: 50, stamina: 50, goalkeeping: 50,
        positioning: 50, longPass: 50, shortPass: 50
    }
});

describe('balancingService — balanceTeams', () => {
    it('should split 10 players into two equal teams', () => {
        const players = [
            makePlayer('1', 'GK', 80), makePlayer('2', 'GK', 70),
            makePlayer('3', 'DEF', 75), makePlayer('4', 'DEF', 65),
            makePlayer('5', 'MID', 85), makePlayer('6', 'MID', 60),
            makePlayer('7', 'MID', 72), makePlayer('8', 'MID', 68),
            makePlayer('9', 'FWD', 90), makePlayer('10', 'FWD', 55)
        ];
        const { teamA, teamB } = balanceTeams(players);
        expect(teamA.length).toBe(5);
        expect(teamB.length).toBe(5);
    });

    it('should handle odd number of players', () => {
        const players = [
            makePlayer('1', 'GK', 80),
            makePlayer('2', 'MID', 70),
            makePlayer('3', 'MID', 65),
        ];
        const { teamA, teamB } = balanceTeams(players);
        expect(teamA.length + teamB.length).toBe(3);
    });

    it('should handle 2 players (minimum)', () => {
        const players = [
            makePlayer('1', 'FWD', 80),
            makePlayer('2', 'FWD', 70),
        ];
        const { teamA, teamB } = balanceTeams(players);
        expect(teamA.length).toBe(1);
        expect(teamB.length).toBe(1);
    });

    it('should auto-assign a temporary GK when no GK is present', () => {
        const players = [
            makePlayer('1', 'DEF', 80), // highest defending — becomes temp GK
            makePlayer('2', 'MID', 70),
            makePlayer('3', 'FWD', 65),
            makePlayer('4', 'FWD', 60),
        ];
        const { teamA, teamB } = balanceTeams(players);
        const allPlayers = [...teamA, ...teamB];
        const tempGK = allPlayers.find(p => p.isTemporaryGK);
        expect(tempGK).toBeDefined();
    });

    it('should produce teams with reasonably balanced total ratings', () => {
        const players = [
            makePlayer('1', 'GK', 90), makePlayer('2', 'GK', 85),
            makePlayer('3', 'DEF', 80), makePlayer('4', 'DEF', 75),
            makePlayer('5', 'FWD', 70), makePlayer('6', 'FWD', 65),
        ];
        const { totalRatingA, totalRatingB } = balanceTeams(players);
        const diff = Math.abs(totalRatingA - totalRatingB);
        expect(diff).toBeLessThanOrEqual(20); // teams should be close
    });
});
