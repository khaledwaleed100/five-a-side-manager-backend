const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    position: { type: String, enum: ['GK', 'DEF', 'MID', 'FWD'], required: true },
    attributes: {
        speed: { type: Number, min: 1, max: 99, default: 50 },
        shooting: { type: Number, min: 1, max: 99, default: 50 },
        passing: { type: Number, min: 1, max: 99, default: 50 },
        defending: { type: Number, min: 1, max: 99, default: 50 },
        physical: { type: Number, min: 1, max: 99, default: 50 }
    },
    overallRating: { type: Number },
    performanceTrend: { type: String, default: 'stable' }
}, { timestamps: true });

playerSchema.pre('save', function() {
    const { speed, shooting, passing, defending, physical } = this.attributes;
    this.overallRating = Math.round((speed + shooting + passing + defending + physical) / 5);
});

module.exports = mongoose.model('Player', playerSchema);
