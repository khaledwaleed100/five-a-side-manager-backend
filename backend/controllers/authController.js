import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { randomBytes, createHash } from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const generateAccessToken = (id) => {
    return sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
    console.log(`Registration attempt for email: ${req.body.email}`);
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    if (!email.endsWith('@five.com')) {
        res.status(400);
        throw new Error('Email must end with @five.com');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name: req.body.name || 'Manager',
        email,
        passwordHash: password // will be hashed in pre-save middleware
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !email.endsWith('@five.com')) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // always secure in production (required for sameSite: None)
            sameSite: 'None', // required for cross-origin (Vercel <-> Render)
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            isAdmin: user.isAdmin,
            accessToken
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no refresh token');
    }

    try {
        const decoded = verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }

        const newAccessToken = generateAccessToken(user._id);

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401);
        throw new Error('Not authorized, token failed');
    }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.refreshToken = '';
        await user.save();
    }

    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        expires: new Date(0)
    });

    res.json({ message: 'Logged out successfully' });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.name = req.body.name || user.name;
        if (req.body.password) {
            user.passwordHash = req.body.password;
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        res.status(404);
        throw new Error('There is no user with that email');
    }

    // Get reset token
    const resetToken = randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = createHash('sha256').update(resetToken).digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset url
    // Assuming frontend runs on same host or localhost:4200
    const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;

    console.log('---------------------------------------------------------');
    console.log(`PASSWORD RESET LINK FOR ${user.email}:`);
    console.log(resetUrl);
    console.log('---------------------------------------------------------');

    res.status(200).json({ success: true, message: 'Email sent' });
});

// @desc    Reset Password
// @route   POST /api/auth/resetpassword/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    // Set new password
    user.passwordHash = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
});

export {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    updateProfile,
    forgotPassword,
    resetPassword
};
