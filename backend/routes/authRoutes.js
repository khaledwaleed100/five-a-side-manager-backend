import express from 'express';
import { registerUser, loginUser, refreshToken, logoutUser, updateProfile, getSecurityQuestion, verifySecurityAnswer, resetPasswordWithToken } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logoutUser);
router.put('/profile', protect, updateProfile);

// Password Reset Flow
router.post('/security-question', authLimiter, getSecurityQuestion);
router.post('/verify-security-answer', authLimiter, verifySecurityAnswer);
router.post('/reset-password', authLimiter, resetPasswordWithToken);

export default router;
