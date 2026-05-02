import { find, findOne, create, findByIdAndUpdate, findById } from '../models/Match.js';
import Player from '../models/Player.js';
import { balanceTeams } from '../services/balancingService.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all matches for a user
// @route   GET /api/matches
// @access  Private
const getMatches = asyncHandler(async (req, res, next) => {
    const matches = await find({ userId: req.user.id }).sort({ date: 1 });
    res.json(matches);
});

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Private
const getMatch = asyncHandler(async (req, res, next) => {
    const match = await findOne({ _id: req.params.id, userId: req.user.id })
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
const createMatch = asyncHandler(async (req, res, next) => {
    const { place, date, time } = req.body;

    if (!place || !date || !time) {
        res.status(400);
        throw new Error('Please add place, date, and time');
    }

    const match = await create({
        userId: req.user.id,
        place,
        date,
        time,
        roster: [],
        teamA: [],
        teamB: []
    });

    res.status(201).json(match);
});

// @desc    Update a match (roster or details)
// @route   PUT /api/matches/:id
// @access  Private
const updateMatch = asyncHandler(async (req, res, next) => {
    const match = await findOne({ _id: req.params.id, userId: req.user.id });

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const updatedMatch = await findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after' }
    ).populate('roster').populate('teamA').populate('teamB');

    res.json(updatedMatch);
});

// @desc    Delete a match
// @route   DELETE /api/matches/:id
// @access  Private
const deleteMatch = asyncHandler(async (req, res, next) => {
    const match = await findOne({ _id: req.params.id, userId: req.user.id });

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
const generateTeams = asyncHandler(async (req, res, next) => {
    const match = await findOne({ _id: req.params.id, userId: req.user.id }).populate('roster');

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match.roster.length < 2) {
        res.status(400);
        throw new Error('Need at least 2 players in roster to generate teams');
    }

    // The balancing service takes full player objects and returns { teamA, teamB }
    const balanced = balanceTeams(match.roster);

    match.teamA = balanced.teamA.map(p => p._id);
    match.teamB = balanced.teamB.map(p => p._id);
    
    await match.save();
    
    // Return populated match
    const updatedMatch = await findById(req.params.id)
        .populate('roster')
        .populate('teamA')
        .populate('teamB');

    res.json(updatedMatch);
});

export {
    getMatches,
    getMatch,
    createMatch,
    updateMatch,
    deleteMatch,
    generateTeams
};
