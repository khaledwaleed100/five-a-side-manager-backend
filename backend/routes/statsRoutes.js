import { Router } from 'express';
import Match from '../models/Match.js';
import Player from '../models/Player.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// @desc    Get leaderboard stats for the current user's players
// @route   GET /api/stats/leaderboard
// @access  Private
router.get('/leaderboard', protect, asyncHandler(async (req, res) => {
    const completedMatches = await Match.find({
        userId: req.user.id,
        status: 'completed'
    });

    // Aggregate player stats from all completed matches
    const statsMap = {};

    for (const match of completedMatches) {
        for (const stat of match.playerStats) {
            const pid = stat.playerId?.toString();
            if (!pid) continue;
            if (!statsMap[pid]) {
                statsMap[pid] = { goals: 0, assists: 0, mvpAwards: 0, matchesPlayed: 0 };
            }
            statsMap[pid].goals += stat.goals || 0;
            statsMap[pid].assists += stat.assists || 0;
            if (stat.isMvp) statsMap[pid].mvpAwards += 1;
            statsMap[pid].matchesPlayed += 1;
        }
    }

    const playerIds = Object.keys(statsMap);
    const players = await Player.find({
        _id: { $in: playerIds },
        userId: req.user.id
    });

    const leaderboard = players.map(p => ({
        _id: p._id,
        name: p.name,
        position: p.position,
        overallRating: p.overallRating,
        avatarUrl: p.avatarUrl,
        performanceTrend: p.performanceTrend,
        goals: statsMap[p._id.toString()]?.goals || 0,
        assists: statsMap[p._id.toString()]?.assists || 0,
        mvpAwards: statsMap[p._id.toString()]?.mvpAwards || 0,
        matchesPlayed: statsMap[p._id.toString()]?.matchesPlayed || 0,
    })).sort((a, b) => b.goals - a.goals || b.assists - a.assists);

    const totalMatches = completedMatches.length;

    res.json({ leaderboard, totalMatches });
}));

// @desc    Get overview stats summary
// @route   GET /api/stats/summary
// @access  Private
router.get('/summary', protect, asyncHandler(async (req, res) => {
    const [totalMatches, upcomingMatches, players] = await Promise.all([
        Match.countDocuments({ userId: req.user.id }),
        Match.countDocuments({ userId: req.user.id, status: 'upcoming' }),
        Player.find({ userId: req.user.id })
    ]);

    const completedMatches = totalMatches - upcomingMatches;

    const topScorer = players
        .map(p => ({ name: p.name, goals: p.stats?.goals || 0, avatarUrl: p.avatarUrl }))
        .sort((a, b) => b.goals - a.goals)[0] || null;

    const hotPlayers = players.filter(p => p.performanceTrend === 'hot');

    res.json({
        totalMatches,
        completedMatches,
        upcomingMatches,
        totalPlayers: players.length,
        topScorer,
        hotPlayers: hotPlayers.map(p => ({ name: p.name, _id: p._id, avatarUrl: p.avatarUrl }))
    });
}));

export default router;
