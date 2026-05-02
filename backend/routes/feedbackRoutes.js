import express from 'express';
import { createFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createFeedback);

export default router;
