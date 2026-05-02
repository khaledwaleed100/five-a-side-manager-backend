import { Router } from 'express';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../controllers/playerController.js';
import { protect } from '../middlewares/authMiddleware.js';


const router = Router();

router.route('/').get(protect, getPlayers).post(protect, createPlayer);
router.route('/:id').put(protect, updatePlayer).delete(protect, deletePlayer);

export default router;
