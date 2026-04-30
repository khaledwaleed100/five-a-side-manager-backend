const Feedback = require('../models/Feedback');

// @desc    Add new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400);
            throw new Error('Please add a message');
        }

        const feedback = await Feedback.create({
            userId: req.user.id,
            message
        });

        res.status(201).json(feedback);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createFeedback
};
