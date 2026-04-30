const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, default: 'Manager' },
    passwordHash: { type: String, required: true },
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
    },
    isAdmin: { type: Boolean, default: false },
    refreshToken: { type: String },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
