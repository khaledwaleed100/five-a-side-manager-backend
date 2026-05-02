import { find, countDocuments } from '../models/User.js';
import { countDocuments as _countDocuments } from '../models/Player.js';
import { countDocuments as __countDocuments, find as _find } from '../models/Feedback.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await find({}).select('-passwordHash');
    res.json(users);
});

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = asyncHandler(async (req, res, next) => {
    const totalUsers = await countDocuments();
    const totalPlayers = await _countDocuments();
    const totalFeedback = await __countDocuments();
    
    res.json({
        users: totalUsers,
        players: totalPlayers,
        feedback: totalFeedback
    });
});

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private/Admin
const getAllFeedback = asyncHandler(async (req, res, next) => {
    const feedback = await _find({}).populate('userId', 'email').sort({ createdAt: -1 });
    res.json(feedback);
});

export  {
    getAllUsers,
    getSystemStats,
    getAllFeedback
};
