const express = require('express');
const router = express.Router();
const { getMatches, getMatch, createMatch, updateMatch, deleteMatch, generateTeams } = require('../controllers/matchController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getMatches)
    .post(protect, createMatch);

router.route('/:id')
    .get(protect, getMatch)
    .put(protect, updateMatch)
    .delete(protect, deleteMatch);

router.post('/:id/generate', protect, generateTeams);

module.exports = router;
