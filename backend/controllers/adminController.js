const User = require('../models/User');
const Player = require('../models/Player');
const Feedback = require('../models/Feedback');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-passwordHash');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPlayers = await Player.countDocuments();
        const totalFeedback = await Feedback.countDocuments();
        
        res.json({
            users: totalUsers,
            players: totalPlayers,
            feedback: totalFeedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private/Admin
const getAllFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({}).populate('userId', 'email').sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getSystemStats,
    getAllFeedback
};
