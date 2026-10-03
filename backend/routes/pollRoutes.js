import express from 'express';
import {
    generatePoll,
    generateWeeklyPoll,
    getPolls,
    getPollStatus,
    voteOnPoll,
    closePoll
} from '../controllers/pollController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { pollLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Polls have their own (more generous) limiter because phones refresh them while a vote is open.
router.use(pollLimiter);
router.use(protect);

router.get('/', getPolls);
router.get('/status', getPollStatus);
router.post('/generate', generatePoll);
router.post('/generate-weekly', generateWeeklyPoll);
router.post('/:id/vote', voteOnPoll);
router.post('/:id/close', closePoll);

export default router;
