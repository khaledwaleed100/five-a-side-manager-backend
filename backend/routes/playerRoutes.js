import { Router } from 'express';
import {
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    uploadAvatar,
    getAiReport,
    deleteAllPlayers,
    upload
} from '../controllers/playerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.route('/')
    .get(protect, getPlayers)
    .post(protect, createPlayer)
    .delete(protect, deleteAllPlayers);

router.route('/:id')
    .put(protect, updatePlayer)
    .delete(protect, deletePlayer);

router.post('/:id/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/:id/ai-report', protect, getAiReport);

export default router;
