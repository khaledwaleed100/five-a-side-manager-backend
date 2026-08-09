import Feedback from '../models/Feedback.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Add new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = asyncHandler(async (req, res) => {
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
});

export { createFeedback };
