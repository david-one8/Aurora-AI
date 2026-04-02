const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
};

async function registerUser(req, res) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName?.firstName || !fullName?.lastName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const { firstName, lastName } = fullName;
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            fullName: {
                firstName,
                lastName
            },
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie('token', token, authCookieOptions);

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                email: user.email,
                _id: user._id,
                fullName: user.fullName
            }
        });
    } catch {
        return res.status(500).json({ message: 'Unable to register user right now' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie('token', token, authCookieOptions);

        return res.status(200).json({
            message: 'User logged in successfully',
            user: {
                email: user.email,
                _id: user._id,
                fullName: user.fullName
            }
        });
    } catch {
        return res.status(500).json({ message: 'Unable to log in right now' });
    }
}

function logoutUser(req, res) {
    res.clearCookie('token', authCookieOptions);
    return res.status(200).json({ message: 'User logged out successfully' });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser
};
