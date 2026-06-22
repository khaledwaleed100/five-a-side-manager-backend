import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    position: { type: String, enum: ['GK', 'DEF', 'MID', 'FWD'], required: true },
    attributes: {
        speed: { type: Number, min: 1, max: 99, default: 50 },
        shooting: { type: Number, min: 1, max: 99, default: 50 },
        passing: { type: Number, min: 1, max: 99, default: 50 },
        defending: { type: Number, min: 1, max: 99, default: 50 },
        physical: { type: Number, min: 1, max: 99, default: 50 },
        stamina: { type: Number, min: 1, max: 99, default: 50 },
        goalkeeping: { type: Number, min: 1, max: 99, default: 50 },
        positioning: { type: Number, min: 1, max: 99, default: 50 },
        longPass: { type: Number, min: 1, max: 99, default: 50 },
        shortPass: { type: Number, min: 1, max: 99, default: 50 }
    },
    overallRating: { type: Number },
    performanceTrend: { type: String, default: 'stable' },
    stats: {
        matchesPlayed: { type: Number, default: 0 },
        goals: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        mvpAwards: { type: Number, default: 0 }
    }
}, { timestamps: true });

playerSchema.pre('save', function() {
    const { speed, shooting, passing, defending, physical, stamina, goalkeeping, positioning, longPass, shortPass } = this.attributes;
    this.overallRating = Math.round((speed + shooting + passing + defending + physical + stamina + goalkeeping + positioning + longPass + shortPass) / 10);
});

const Player = mongoose.model('Player', playerSchema);

export default Player;
export const find = (query) => Player.find(query);
export const create = (data) => Player.create(data);
export const findById = (id) => Player.findById(id);
export const findByIdAndUpdate = (id, data) => Player.findByIdAndUpdate(id, data, { new: true });
export const countDocuments = () => Player.countDocuments();
