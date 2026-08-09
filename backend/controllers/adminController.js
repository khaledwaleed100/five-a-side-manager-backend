import User from '../models/User.js';
import Player from '../models/Player.js';
import Feedback from '../models/Feedback.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-passwordHash');
    res.json(users);
});

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalPlayers = await Player.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    res.json({
        users: totalUsers,
        players: totalPlayers,
        feedback: totalFeedback
    });
});

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private/Admin
const getAllFeedback = asyncHandler(async (req, res) => {
    const feedback = await Feedback.find({}).populate('userId', 'email').sort({ createdAt: -1 });
    res.json(feedback);
});

export {
    getAllUsers,
    getSystemStats,
    getAllFeedback
};
