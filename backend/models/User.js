import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Manager' },
    passwordHash: { type: String, required: true },
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
    },
    isAdmin: { type: Boolean, default: false },
    refreshToken: { type: String },
    securityQuestion: { type: String },
    securityAnswerHash: { type: String },
    tempResetToken: String,
    tempResetTokenExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('passwordHash')) {
            const salt = await bcrypt.genSalt(10);
            this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        }
        if (this.isModified('securityAnswerHash')) {
            const salt = await bcrypt.genSalt(10);
            this.securityAnswerHash = await bcrypt.hash(this.securityAnswerHash, salt);
        }
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.matchSecurityAnswer = async function(enteredAnswer) {
    if (!this.securityAnswerHash) return false;
    // We lowercase and trim the entered answer to make it slightly forgiving
    const normalizedAnswer = enteredAnswer.toLowerCase().trim();
    return await bcrypt.compare(normalizedAnswer, this.securityAnswerHash);
};

const User = mongoose.model('User', userSchema);

export default User;
export const findOne = (query) => User.findOne(query);
export const create = (data) => User.create(data);
export const findById = (id) => User.findById(id);
export const find = (query) => User.find(query);
export const countDocuments = () => User.countDocuments();
