import express from 'express';
import { registerUser, loginUser, refreshToken, logoutUser, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logoutUser);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/resetpassword/:token', authLimiter, resetPassword);

export default router;
