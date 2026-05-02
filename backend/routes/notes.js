import express from 'express';
import Note from '../models/Note.js';
import { protect, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all notes for the current admin
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const notes = await Note.find({ adminId: req.user._id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create a new note
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Note content is required' });
        }

        const newNote = new Note({
            content,
            adminId: req.user._id
        });

        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete a note
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
