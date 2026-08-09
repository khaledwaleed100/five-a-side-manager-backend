import Match from '../models/Match.js';
import Player from '../models/Player.js';
import { balanceTeams } from '../services/balancingService.js';
import { getAiMvpSuggestion, checkSchedulingConflict } from '../services/aiService.js';
import { sendMatchCreationEmail } from '../services/emailService.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all matches for a user
// @route   GET /api/matches
// @access  Private
const getMatches = asyncHandler(async (req, res) => {
    const matches = await Match.find({ userId: req.user.id }).sort({ date: 1 });
    res.json(matches);
});

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Private
const getMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.id, userId: req.user.id })
        .populate('roster')
        .populate('teamA')
        .populate('teamB');

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }
    res.json(match);
});

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private
const createMatch = asyncHandler(async (req, res) => {
    const { place, date, time } = req.body;

    if (!place || !date || !time) {
        res.status(400);
        throw new Error('Please add place, date, and time');
    }

    // AI Feature 4: Scheduling Conflict Detection
    let conflictWarning = null;
    if (process.env.GEMINI_API_KEY) {
        const existingMatches = await Match.find({ userId: req.user.id, status: 'upcoming' });
        conflictWarning = await checkSchedulingConflict(existingMatches, { date, time, place });
    }

    const match = await Match.create({
        userId: req.user.id,
        place,
        date,
        time,
        roster: [],
        teamA: [],
        teamB: []
    });

    // Send notification email to the manager (non-blocking)
    sendMatchCreationEmail(req.user, match).catch(err =>
        console.error('Email notification failed (non-critical):', err.message)
    );

    res.status(201).json({ match, conflictWarning });
});

// @desc    Update a match (roster or details)
// @route   PUT /api/matches/:id
// @access  Private
const updateMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.id, userId: req.user.id });

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const updatedMatch = await Match.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    ).populate('roster').populate('teamA').populate('teamB');

    res.json(updatedMatch);
});

// @desc    Delete a match
// @route   DELETE /api/matches/:id
// @access  Private
const deleteMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.id, userId: req.user.id });

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    await match.deleteOne();
    res.json({ id: req.params.id });
});

// @desc    Generate balanced teams from roster
// @route   POST /api/matches/:id/generate
// @access  Private
const generateTeams = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.id, userId: req.user.id }).populate('roster');

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match.roster.length < 2) {
        res.status(400);
        throw new Error('Need at least 2 players in roster to generate teams');
    }

    const balanced = balanceTeams(match.roster);

    match.teamA = balanced.teamA.map(p => p._id);
    match.teamB = balanced.teamB.map(p => p._id);

    await match.save();

    const updatedMatch = await Match.findById(req.params.id)
        .populate('roster')
        .populate('teamA')
        .populate('teamB');

    res.json(updatedMatch);
});

// @desc    Complete a match and save stats
// @route   POST /api/matches/:id/complete
// @access  Private
const completeMatch = asyncHandler(async (req, res) => {
    const { finalScore, playerStats } = req.body;

    const match = await Match.findOne({ _id: req.params.id, userId: req.user.id });
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match.status === 'completed') {
        res.status(400);
        throw new Error('Match is already completed');
    }

    match.status = 'completed';
    if (finalScore) match.finalScore = finalScore;
    if (playerStats) match.playerStats = playerStats;

    // AI Feature 3: Automated MVP Suggestion
    const mvpAlreadySet = playerStats?.some(s => s.isMvp);
    if (!mvpAlreadySet && playerStats?.length > 0 && process.env.GEMINI_API_KEY) {
        try {
            const playerIds = playerStats.map(s => s.playerId);
            const players = await Player.find({ _id: { $in: playerIds } });
            const suggestion = await getAiMvpSuggestion(playerStats, players);
            match.aiMvpSuggestion = suggestion;
        } catch (err) {
            console.error('AI MVP suggestion failed (non-critical):', err.message);
        }
    }

    await match.save();

    // Update all participating players' all-time stats + performance trend
    if (playerStats && playerStats.length > 0) {
        for (const stat of playerStats) {
            const player = await Player.findById(stat.playerId);
            if (player) {
                player.stats.matchesPlayed += 1;
                player.stats.goals += stat.goals || 0;
                player.stats.assists += stat.assists || 0;
                if (stat.isMvp) {
                    player.stats.mvpAwards += 1;
                }

                // Track recent goals for trend (keep last 5 matches)
                const recentGoals = [...(player.recentGoals || []), stat.goals || 0].slice(-5);
                player.recentGoals = recentGoals;

                // Performance trend logic
                if (recentGoals.length >= 3) {
                    const last3 = recentGoals.slice(-3);
                    const totalRecent = last3.reduce((a, b) => a + b, 0);
                    if (last3.every(g => g > 0)) {
                        player.performanceTrend = 'hot'; // scored in each of last 3 matches
                    } else if (totalRecent === 0 && recentGoals.length >= 3) {
                        player.performanceTrend = 'cold'; // no goals in last 3 matches
                    } else {
                        player.performanceTrend = 'stable';
                    }
                }

                await player.save();
            }
        }
    }

    const updatedMatch = await Match.findById(req.params.id)
        .populate('roster')
        .populate('teamA')
        .populate('teamB')
        .populate('playerStats.playerId');

    res.json(updatedMatch);
});

export {
    getMatches,
    getMatch,
    createMatch,
    updateMatch,
    deleteMatch,
    generateTeams,
    completeMatch
};
