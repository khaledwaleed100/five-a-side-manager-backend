/**
 * PollService — business rules for Player-of-the-Week / Month polls.
 *
 * Kept free of Express objects (SRP) so the controller stays thin and the
 * ranking / serialisation logic can be unit-tested without a database.
 */
import Poll from '../models/Poll.js';
import Match from '../models/Match.js';

export const POLL_CONFIG = {
    weekly: { matchesRequired: 3, candidateLimit: 5, title: 'Player of the Week' },
    monthly: { matchesRequired: 12, candidateLimit: 5, title: 'Player of the Month' }
};

export const isValidPollType = (type) => Object.prototype.hasOwnProperty.call(POLL_CONFIG, type);

/**
 * Filter for completed matches of a manager that were not yet used by a poll of this type.
 * Note: db.js enables MongoDB Stable API `strict: true`, which forbids `distinct`,
 * so used match ids are collected with a plain projection instead.
 */
const pendingMatchFilter = async (userId, type) => {
    const polls = await Poll.find({ userId, type }).select('matchesIncluded').lean();
    const alreadyUsed = polls.flatMap(p => p.matchesIncluded);
    return { userId, status: 'completed', _id: { $nin: alreadyUsed } };
};

export const getPendingMatchCount = async (userId, type) => {
    const filter = await pendingMatchFilter(userId, type);
    return Match.countDocuments(filter);
};

export const getPendingMatches = async (userId, type) => {
    const filter = await pendingMatchFilter(userId, type);
    return Match.find(filter)
        .sort({ date: -1 })
        .limit(POLL_CONFIG[type].matchesRequired);
};

/**
 * Aggregates per-match ratings into per-player averages and returns the
 * top candidates (highest average rating first, goal contributions break ties).
 */
export const rankCandidates = (matches, limit) => {
    const totals = new Map();

    for (const match of matches) {
        for (const stat of match.playerStats || []) {
            if (!stat.playerId) continue;
            const pid = stat.playerId.toString();
            const entry = totals.get(pid) || { playerId: pid, ratingSum: 0, goals: 0, assists: 0, matches: 0 };
            entry.ratingSum += stat.matchRating || 0;
            entry.goals += stat.goals || 0;
            entry.assists += stat.assists || 0;
            entry.matches += 1;
            totals.set(pid, entry);
        }
    }

    return [...totals.values()]
        .map(e => ({
            playerId: e.playerId,
            avgRating: parseFloat((e.ratingSum / e.matches).toFixed(1)),
            goals: e.goals,
            assists: e.assists,
            matches: e.matches
        }))
        .sort((a, b) =>
            b.avgRating - a.avgRating ||
            (b.goals + b.assists) - (a.goals + a.assists) ||
            b.matches - a.matches)
        .slice(0, limit);
};

/** Picks the winner: most votes, ties broken by the higher average rating. */
export const pickWinner = (poll) => {
    const counts = new Map();
    for (const v of poll.votes) {
        const pid = v.playerId.toString();
        counts.set(pid, (counts.get(pid) || 0) + 1);
    }
    if (counts.size === 0) return null;

    const ratingOf = (pid) =>
        poll.candidateStats.find(s => s.playerId.toString() === pid)?.avgRating || 0;

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || ratingOf(b[0]) - ratingOf(a[0]))[0][0];
};

/**
 * Converts a populated Poll document into the lean payload the phone UI needs.
 * Never leaks who voted for whom — only whether *this* user voted, and for whom.
 */
export const serializePoll = (poll, viewerId) => {
    const viewer = viewerId.toString();
    const totalVotes = poll.votes.length;
    const myVote = poll.votes.find(v => v.userId.toString() === viewer);

    const countByPlayer = new Map();
    for (const v of poll.votes) {
        const pid = v.playerId.toString();
        countByPlayer.set(pid, (countByPlayer.get(pid) || 0) + 1);
    }

    const candidates = poll.candidates.map(player => {
        const pid = player._id.toString();
        const snap = poll.candidateStats.find(s => s.playerId.toString() === pid) || {};
        const votes = countByPlayer.get(pid) || 0;
        return {
            _id: pid,
            name: player.name,
            position: player.position,
            avatarUrl: player.avatarUrl,
            overallRating: player.overallRating,
            avgRating: snap.avgRating || 0,
            goals: snap.goals || 0,
            assists: snap.assists || 0,
            matches: snap.matches || 0,
            votes,
            percent: totalVotes ? Math.round((votes / totalVotes) * 100) : 0
        };
    });

    return {
        _id: poll._id.toString(),
        title: poll.title,
        type: poll.type,
        isActive: poll.isActive,
        createdAt: poll.createdAt,
        closedAt: poll.closedAt,
        isOwner: poll.userId.toString() === viewer,
        hasVoted: !!myVote,
        myVote: myVote ? myVote.playerId.toString() : null,
        totalVotes,
        winnerId: poll.winner ? poll.winner.toString() : null,
        candidates
    };
};
