import { find, create, findById, findByIdAndUpdate } from '../models/Player.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all players for a user
// @route   GET /api/players
// @access  Private
const getPlayers = asyncHandler(async (req, res, next) => {
    const players = await find({ userId: req.user.id });
    res.json(players);
});

// @desc    Add new player
// @route   POST /api/players
// @access  Private
const createPlayer = asyncHandler(async (req, res, next) => {
    const { name, position, attributes } = req.body;

    if (!name || !position) {
        res.status(400);
        throw new Error('Please add name and position');
    }

    const player = await create({
        userId: req.user.id,
        name,
        position,
        attributes
    });

    res.status(201).json(player);
});

// @desc    Update player
// @route   PUT /api/players/:id
// @access  Private
const updatePlayer = asyncHandler(async (req, res, next) => {
    const player = await findById(req.params.id);

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    // Check for user
    if (player.userId.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after', runValidators: true }
    );

    // Explicitly trigger pre-save hook for overall rating
    const doc = await findById(req.params.id);
    await doc.save();

    res.json(doc);
});

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Private
const deletePlayer = asyncHandler(async (req, res, next) => {
    const player = await findById(req.params.id);

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    if (player.userId.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await player.deleteOne();

    res.json({ id: req.params.id });
});

export{
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer
};
