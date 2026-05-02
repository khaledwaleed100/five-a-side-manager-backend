import express from 'express';
import { getAllUsers, getSystemStats, getAllFeedback } from '../controllers/adminController.js';
import { protect, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, isAdmin, getAllUsers);
router.get('/stats', protect, isAdmin, getSystemStats);
router.get('/feedback', protect, isAdmin, getAllFeedback);

export default router;
