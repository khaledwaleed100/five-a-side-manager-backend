const express = require('express');
const router = express.Router();
const { getAllUsers, getSystemStats, getAllFeedback } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.get('/users', protect, isAdmin, getAllUsers);
router.get('/stats', protect, isAdmin, getSystemStats);
router.get('/feedback', protect, isAdmin, getAllFeedback);

module.exports = router;
