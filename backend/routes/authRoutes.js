const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, logoutUser, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logoutUser);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/resetpassword/:token', authLimiter, resetPassword);

module.exports = router;
