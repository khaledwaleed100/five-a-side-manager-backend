import mongoose from 'mongoose';

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
    },
    status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
    playerStats: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        goals: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        isMvp: { type: Boolean, default: false }
    }],
    aiMvpSuggestion: { type: String, default: null }
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);

export default Match;
