const express = require('express');
const router = express.Router();
const { getPlayers, createPlayer, updatePlayer, deletePlayer } = require('../controllers/playerController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getPlayers).post(protect, createPlayer);
router.route('/:id').put(protect, updatePlayer).delete(protect, deletePlayer);

module.exports = router;
