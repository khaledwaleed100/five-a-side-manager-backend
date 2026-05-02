import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

userSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

export default User;
export const findOne = (query) => User.findOne(query);
export const create = (data) => User.create(data);
export const findById = (id) => User.findById(id);
export const find = (query) => User.find(query);
export const countDocuments = () => User.countDocuments();
