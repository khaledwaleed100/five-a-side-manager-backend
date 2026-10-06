import mongoose from 'mongoose';
import asyncHandler from '../middlewares/asyncHandler.js';
import Poll from '../models/Poll.js';
import {
    POLL_CONFIG,
    isValidPollType,
    getPendingMatches,
    getPendingMatchCount,
    rankCandidates,
    pickWinner,
    serializePoll
} from '../services/pollService.js';

const CANDIDATE_FIELDS = 'name position avatarUrl overallRating';
const RECENTLY_CLOSED_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const FORCE_MIN_MATCHES = 1;

const loadSerialized = async (pollId, viewerId) => {
    const poll = await Poll.findById(pollId).populate('candidates', CANDIDATE_FIELDS);
    return serializePoll(poll, viewerId);
};

// @desc    Poll-readiness for the manager (drives the "Start poll" button)
// @route   GET /api/polls/status
// @access  Private
export const getPollStatus = asyncHandler(async (req, res) => {
    const isAdmin = !!req.user.isAdmin;
    const status = { isAdmin };
    for (const [type, cfg] of Object.entries(POLL_CONFIG)) {
        const [pending, active] = await Promise.all([
            getPendingMatchCount(req.user.id, type),
            Poll.findOne({ userId: req.user.id, type, isActive: true }).select('_id')
        ]);
        status[type] = {
            required: cfg.matchesRequired,
            completed: Math.min(pending, cfg.matchesRequired),
            pending,
            canGenerate: pending >= cfg.matchesRequired && !active,
            // Admins may open a poll early, as long as at least one rated match exists.
            canForce: isAdmin && pending >= FORCE_MIN_MATCHES && pending < cfg.matchesRequired && !active,
            activePollId: active ? active._id.toString() : null
        };
    }
    res.json(status);
});

// @desc    Generate a Player-of-the-Week / Month poll from the latest unpolled matches
// @route   POST /api/polls/generate   (body: { type: 'weekly' | 'monthly', force?: boolean })
// @route   POST /api/polls/generate-weekly   (kept for backwards compatibility)
// @access  Private (force: admin only)
export const generatePoll = asyncHandler(async (req, res) => {
    const type = req.body?.type || 'weekly';
    if (!isValidPollType(type)) {
        res.status(400);
        throw new Error('Invalid poll type');
    }
    const cfg = POLL_CONFIG[type];
    const force = req.body?.force === true;
    if (force && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Only an admin can start a poll early');
    }
    const minMatches = force ? FORCE_MIN_MATCHES : cfg.matchesRequired;

    const existing = await Poll.findOne({ userId: req.user.id, type, isActive: true });
    if (existing) {
        res.status(409);
        throw new Error(`A ${type} poll is already open. Close it before starting a new one.`);
    }

    const matches = await getPendingMatches(req.user.id, type);
    if (matches.length < minMatches) {
        res.status(400);
        throw new Error(force
            ? 'Complete at least one match and enter player ratings before starting a poll.'
            : `Need ${cfg.matchesRequired} completed matches for a ${type} poll — you have ${matches.length}.`
        );
    }

    const ranked = rankCandidates(matches, cfg.candidateLimit);
    if (ranked.length < 2) {
        res.status(400);
        throw new Error('Not enough player stats recorded to build a poll. Enter stats for each match first.');
    }

    const poll = await Poll.create({
        userId: req.user.id,
        title: cfg.title,
        type,
        candidates: ranked.map(r => r.playerId),
        candidateStats: ranked,
        matchesIncluded: matches.map(m => m._id)
    });

    res.status(201).json(await loadSerialized(poll._id, req.user.id));
});

export const generateWeeklyPoll = asyncHandler(async (req, res, next) => {
    req.body = { ...(req.body || {}), type: 'weekly' };
    return generatePoll(req, res, next);
});

// @desc    Active polls + recently closed ones (so results stay visible)
// @route   GET /api/polls
// @access  Private
export const getPolls = asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - RECENTLY_CLOSED_WINDOW_MS);
    const polls = await Poll.find({ $or: [{ isActive: true }, { closedAt: { $gte: since } }] })
        .populate('candidates', CANDIDATE_FIELDS)
        .sort({ isActive: -1, createdAt: -1 })
        .limit(10);

    res.set('Cache-Control', 'no-cache');
    res.json(polls.map(p => serializePoll(p, req.user.id)));
});

// @desc    Vote on a poll (one vote per user, enforced atomically)
// @route   POST /api/polls/:id/vote
// @access  Private
export const voteOnPoll = asyncHandler(async (req, res) => {
    const { playerId } = req.body || {};

    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(playerId)) {
        res.status(400);
        throw new Error('Invalid poll or player');
    }

    // Single atomic write: poll must be open, player must be a candidate,
    // and this user must not have a vote yet. Prevents double votes from
    // double-taps or two phones voting at the same time.
    const updated = await Poll.findOneAndUpdate(
        {
            _id: req.params.id,
            isActive: true,
            candidates: playerId,
            'votes.userId': { $ne: req.user.id }
        },
        { $push: { votes: { userId: req.user.id, playerId } } },
        { new: true }
    );

    if (!updated) {
        const poll = await Poll.findById(req.params.id);
        if (!poll) { res.status(404); throw new Error('Poll not found'); }
        if (!poll.isActive) { res.status(400); throw new Error('This poll is closed'); }
        if (poll.votes.some(v => v.userId.toString() === req.user.id.toString())) {
            res.status(409);
            throw new Error('You have already voted in this poll');
        }
        res.status(400);
        throw new Error('That player is not a candidate in this poll');
    }

    res.json(await loadSerialized(updated._id, req.user.id));
});

// @desc    Close a poll and crown the winner (creator only)
// @route   POST /api/polls/:id/close
// @access  Private
export const closePoll = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400);
        throw new Error('Invalid poll');
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) { res.status(404); throw new Error('Poll not found'); }
    if (poll.userId.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error('Only the manager who created this poll can close it');
    }
    if (!poll.isActive) {
        res.status(400);
        throw new Error('Poll is already closed');
    }

    poll.isActive = false;
    poll.closedAt = new Date();
    poll.winner = pickWinner(poll);
    await poll.save();

    res.json(await loadSerialized(poll._id, req.user.id));
});
