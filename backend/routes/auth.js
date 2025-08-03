
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Test route to make sure it's working
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    console.log('Registration attempt:', { username, email, displayName });

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router;


/*const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock database (replace with MongoDB later)
let users = [];
let nextUserId = 1;

// Register endpoint
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => 
      user.username === username || user.email === email
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? 
          'Username already taken' : 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    // Create user
    const newUser = {
      id: nextUserId++,
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      createdAt: new Date(),
      gamesPlayed: 0,
      gamesWon: 0,
      isOnline: false
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userData } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: userData
    });

    console.log(`✅ New user registered: ${username} (${email})`);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login endpoint
router.post('/login', [
  body('identifier').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { identifier, password } = req.body;

    // Find user by username or email
    const user = users.find(u => 
      u.username === identifier || u.email === identifier
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Update user online status
    user.isOnline = true;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userData
    });

    console.log(`✅ User logged in: ${user.username}`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { password: _, ...userData } = user;
  res.json({
    success: true,
    user: userData
  });
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (user) {
    user.isOnline = false;
    console.log(`👋 User logged out: ${user.username}`);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get online users (for multiplayer lobby)
router.get('/online-users', authenticateToken, (req, res) => {
  const onlineUsers = users
    .filter(user => user.isOnline && user.id !== req.user.userId)
    .map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    }));

  res.json({
    success: true,
    onlineUsers,
    count: onlineUsers.length
  });
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// Debug endpoint to see all users (remove in production)
router.get('/debug/users', (req, res) => {
  const safeUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    isOnline: user.isOnline,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    createdAt: user.createdAt
  }));

  res.json({
    success: true,
    users: safeUsers,
    count: users.length
  });
});

module.exports = router;
*/

