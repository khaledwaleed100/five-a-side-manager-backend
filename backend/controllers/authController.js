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
    const { email, password, securityQuestion, securityAnswer } = req.body;

    if (!email || !password || !securityQuestion || !securityAnswer) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Custom domain check removed

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name: req.body.name || 'Manager',
        email,
        passwordHash: password, // will be hashed in pre-save middleware
        securityQuestion,
        securityAnswerHash: securityAnswer.toLowerCase().trim()
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
    const startTime = Date.now();
    const { email, password } = req.body;

    if (!email) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    console.time(`[LOGIN] Query user by email: ${email}`);
    const user = await User.findOne({ email });
    console.timeEnd(`[LOGIN] Query user by email: ${email}`);

    if (user && (await user.matchPassword(password))) {
        console.time(`[LOGIN] Generate tokens`);
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        console.timeEnd(`[LOGIN] Generate tokens`);

        console.time(`[LOGIN] Save refresh token`);
        user.refreshToken = refreshToken;
        await user.save();
        console.timeEnd(`[LOGIN] Save refresh token`);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // always secure in production (required for sameSite: None)
            sameSite: 'None', // required for cross-origin (Vercel <-> Render)
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log(`[LOGIN] Success for ${email} - Total time: ${Date.now() - startTime}ms`);
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            isAdmin: user.isAdmin,
            accessToken
        });
    } else {
        console.log(`[LOGIN] Failed for ${email} - Total time: ${Date.now() - startTime}ms`);
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

// @desc    Get Security Question for Password Reset
// @route   POST /api/auth/security-question
// @access  Public
const getSecurityQuestion = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        res.status(400);
        throw new Error('Please provide an email');
    }
    
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('There is no user with that email');
    }
    
    if (!user.securityQuestion) {
        res.status(400);
        throw new Error('This user does not have a security question set up. Please contact an admin.');
    }

    res.status(200).json({ success: true, securityQuestion: user.securityQuestion });
});

// @desc    Verify Security Answer
// @route   POST /api/auth/verify-security-answer
// @access  Public
const verifySecurityAnswer = asyncHandler(async (req, res, next) => {
    const { email, securityAnswer } = req.body;
    
    if (!email || !securityAnswer) {
        res.status(400);
        throw new Error('Please provide email and security answer');
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.matchSecurityAnswer(securityAnswer);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect security answer');
    }

    // Generate a temporary reset token
    const tempResetToken = randomBytes(20).toString('hex');
    user.tempResetToken = createHash('sha256').update(tempResetToken).digest('hex');
    user.tempResetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    res.status(200).json({ success: true, resetToken: tempResetToken });
});

// @desc    Reset Password with Token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPasswordWithToken = asyncHandler(async (req, res, next) => {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
        res.status(400);
        throw new Error('Please provide all fields');
    }

    const hashedToken = createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        email,
        tempResetToken: hashedToken,
        tempResetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    // Set new password
    user.passwordHash = newPassword;
    user.tempResetToken = undefined;
    user.tempResetTokenExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
});

export {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    updateProfile,
    getSecurityQuestion,
    verifySecurityAnswer,
    resetPasswordWithToken
};
