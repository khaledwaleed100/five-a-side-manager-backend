const Player = require('../models/Player');

// @desc    Get all players for a user
// @route   GET /api/players
// @access  Private
const getPlayers = async (req, res, next) => {
    try {
        const players = await Player.find({ userId: req.user.id });
        res.json(players);
    } catch (error) {
        next(error);
    }
};

// @desc    Add new player
// @route   POST /api/players
// @access  Private
const createPlayer = async (req, res, next) => {
    try {
        const { name, position, attributes } = req.body;

        if (!name || !position) {
            res.status(400);
            throw new Error('Please add name and position');
        }

        const player = await Player.create({
            userId: req.user.id,
            name,
            position,
            attributes
        });

        res.status(201).json(player);
    } catch (error) {
        next(error);
    }
};

// @desc    Update player
// @route   PUT /api/players/:id
// @access  Private
const updatePlayer = async (req, res, next) => {
    try {
        const player = await Player.findById(req.params.id);

        if (!player) {
            res.status(404);
            throw new Error('Player not found');
        }

        // Check for user
        if (player.userId.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        await Player.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        // Explicitly trigger pre-save hook for overall rating
        const doc = await Player.findById(req.params.id);
        await doc.save();

        res.json(doc);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Private
const deletePlayer = async (req, res, next) => {
    try {
        const player = await Player.findById(req.params.id);

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
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer
};
