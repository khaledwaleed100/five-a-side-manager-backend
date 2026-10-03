import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }
}, { timestamps: true });

// Snapshot of each candidate's numbers at the moment the poll was generated,
// so the voting screen never has to recompute ratings and stays stable
// even if matches are edited afterwards.
const candidateStatSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    avgRating: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    matches: { type: Number, default: 0 }
}, { _id: false });

const pollSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Manager who created it
    title: { type: String, required: true },
    type: { type: String, enum: ['weekly', 'monthly'], required: true },
    candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    candidateStats: [candidateStatSchema],
    votes: [voteSchema],
    isActive: { type: Boolean, default: true },
    closedAt: { type: Date, default: null },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    matchesIncluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }]
}, { timestamps: true });

pollSchema.index({ isActive: 1, createdAt: -1 });
pollSchema.index({ userId: 1, type: 1 });

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;
