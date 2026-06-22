import { Router } from 'express';
// Replace these function names with the actual ones inside your matchController!
import { getMatches,getMatch, generateTeams, createMatch, updateMatch, deleteMatch, completeMatch } from '../controllers/matchController.js';
import { protect } from '../middlewares/authMiddleware.js';


const router = Router();

router.route('/')
    .get(protect, getMatches)
    .post(protect, createMatch);

router.route('/:id')
    .get(protect, getMatch)
    .put(protect, updateMatch)
    .delete(protect, deleteMatch);

router.post('/:id/generate', protect, generateTeams);
router.post('/:id/complete', protect, completeMatch);

export default router;
