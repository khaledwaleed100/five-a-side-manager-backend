import Player from '../models/Player.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { getAiPlayerReport } from '../services/aiService.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup — memory storage for Cloudinary streaming
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// @desc    Get all players for a user
// @route   GET /api/players
// @access  Private
const getPlayers = asyncHandler(async (req, res) => {
    const players = await Player.find({ userId: req.user.id });
    res.json(players);
});

// @desc    Add new player
// @route   POST /api/players
// @access  Private
const createPlayer = asyncHandler(async (req, res) => {
    const { name, position, attributes } = req.body;

    if (!name || !position) {
        res.status(400);
        throw new Error('Please add name and position');
    }

    const player = await Player.create({
        userId: req.user.id,
        name,
        position,
        attributes
    });

    res.status(201).json(player);
});

// @desc    Update player
// @route   PUT /api/players/:id
// @access  Private
const updatePlayer = asyncHandler(async (req, res) => {
    const player = await Player.findById(req.params.id);

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    if (player.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('User not authorized');
    }

    // Apply updates and trigger pre-save hook (for overallRating recalc)
    Object.assign(player, req.body);
    const updated = await player.save();

    res.json(updated);
});

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Private
const deletePlayer = asyncHandler(async (req, res) => {
    const player = await Player.findById(req.params.id);

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    if (player.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('User not authorized');
    }

    // Delete avatar from Cloudinary if exists
    if (player.avatarUrl) {
        try {
            const publicId = player.avatarUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`five-a-side/avatars/${publicId}`);
        } catch {
            // Non-critical — continue with player deletion
        }
    }

    await player.deleteOne();
    res.json({ id: req.params.id });
});

// @desc    Upload player avatar
// @route   POST /api/players/:id/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
    const player = await Player.findById(req.params.id);

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    if (player.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('User not authorized');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // Stream buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'five-a-side/avatars',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(req.file.buffer);
    });

    player.avatarUrl = uploadResult.secure_url;
    await player.save();

    res.json({ avatarUrl: player.avatarUrl });
});

// @desc    Get AI performance report for a player
// @route   GET /api/players/:id/ai-report
// @access  Private
const getAiReport = asyncHandler(async (req, res) => {
    const player = await Player.findOne({ _id: req.params.id, userId: req.user.id });

    if (!player) {
        res.status(404);
        throw new Error('Player not found');
    }

    // Return cached report if it's less than 24 hours old
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (
        player.aiReport &&
        player.aiReportGeneratedAt &&
        Date.now() - player.aiReportGeneratedAt.getTime() < oneDayMs
    ) {
        return res.json({ report: player.aiReport, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
        res.status(503);
        throw new Error('AI service not configured');
    }

    const report = await getAiPlayerReport(player);

    player.aiReport = report;
    player.aiReportGeneratedAt = new Date();
    await player.save();

    res.json({ report, cached: false });
});

// @desc    Delete ALL players for a user
// @route   DELETE /api/players
// @access  Private
const deleteAllPlayers = asyncHandler(async (req, res) => {
    const players = await Player.find({ userId: req.user.id });

    // Delete all Cloudinary avatars in parallel (non-critical)
    await Promise.allSettled(
        players
            .filter(p => p.avatarUrl)
            .map(p => {
                const publicId = p.avatarUrl.split('/').pop().split('.')[0];
                return cloudinary.uploader.destroy(`five-a-side/avatars/${publicId}`);
            })
    );

    await Player.deleteMany({ userId: req.user.id });
    res.json({ message: 'All players deleted', count: players.length });
});

export {
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    uploadAvatar,
    getAiReport,
    deleteAllPlayers
};
