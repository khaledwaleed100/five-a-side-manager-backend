const express = require('express');
const router = express.Router();
const { createFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createFeedback);

module.exports = router;
