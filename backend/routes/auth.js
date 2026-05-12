const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  return 'fallback-secret-key-change-in-production';
};

const sanitizeText = (value = '') => String(value).trim();

const isValidEmail = (value) => /.+@.+\..+/.test(value);

router.get('/', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

router.post('/register', async (req, res) => {
  try {
    const username = sanitizeText(req.body.username);
    const email = sanitizeText(req.body.email).toLowerCase();
    const password = sanitizeText(req.body.password);
    const displayName = sanitizeText(req.body.displayName) || username;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 6 and 128 characters'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profile: {
          displayName: user.displayName,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username,
          preferredColor: '#ff4444'
        },
        gameStats: {
          gamesPlayed: user.gamesPlayed || 0,
          gamesWon: user.gamesWon || 0,
          gamesLost: 0,
          winStreak: 0,
          bestWinStreak: 0
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = sanitizeText(req.body.identifier).toLowerCase();
    const password = sanitizeText(req.body.password);

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profile: {
          displayName: user.displayName,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username,
          preferredColor: '#4444ff'
        },
        gameStats: {
          gamesPlayed: user.gamesPlayed || 0,
          gamesWon: user.gamesWon || 0,
          gamesLost: 0,
          winStreak: 0,
          bestWinStreak: 0
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

router.all('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
