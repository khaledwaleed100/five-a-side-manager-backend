const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    place: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    roster: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    finalScore: {
        teamA: { type: Number, default: 0 },
        teamB: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
