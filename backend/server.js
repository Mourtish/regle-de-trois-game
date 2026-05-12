const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const Tokens = require('csrf');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const http = require('http');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',').map((origin) => origin.trim())
].filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

if (!isProduction) {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

const isLocalDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow same-origin/non-browser clients
  if (!isProduction && (origin.includes('github.dev') || origin.includes('apn.github.dev'))) return true;
  if (!isProduction && isLocalDevOrigin(origin)) return true;
  return allowedOrigins.has(origin);
};

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET must be set in production.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set; using development fallback. Not safe for production.');
}

if (isProduction && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is too short. Use at least 32 characters in production.');
  process.exit(1);
}

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  credentials: true
}));

const tokens = new Tokens();

// Generate CSRF secret (can be stored in a secure cookie per-session)
const generateCsrfSecret = () => tokens.secretSync();

const validateCsrf = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const secret = req.cookies._csrf_secret;
    
    if (!token || !secret || !tokens.verify(secret, token)) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token invalid or missing'
      });
    }
  }
  next();
};

app.use(validateCsrf);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please wait and try again.'
  }
});

app.use('/api', apiLimiter);

let dbConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regle-de-trois')
.then(() => {
  dbConnected = true;
  console.log('Connected to MongoDB');
})
.catch((err) => {
  dbConnected = false;
  console.log('MongoDB connection error:', err.message);
});

const authRoutes = require('./routes/auth');

app.get('/api/csrf-token', (req, res) => {
  // Generate or use existing CSRF secret
  let secret = req.cookies._csrf_secret;
  if (!secret) {
    secret = generateCsrfSecret();
    res.cookie('_csrf_secret', secret, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 3600000
    });
  }
  
  // Create token from secret
  const token = tokens.create(secret);
  res.json({ csrfToken: token });
});

app.use('/api/auth', authLimiter, authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Regle de Trois API is running!',
    status: 'success',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    message: 'Regle de Trois API is running!',
    status: 'success',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/game/status', (req, res) => {
  res.json({
    message: 'Game service is ready',
    players_online: 0,
    games_active: 0
  });
});

let games = {};

function broadcastGameList() {
  const gameList = Object.values(games).map((g) => ({ id: g.id, players: g.players.length }));
  io.emit('gameList', gameList);
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('getGames', () => {
    broadcastGameList();
  });

  socket.on('createGame', (cb) => {
    const gameId = Math.random().toString(36).slice(2, 8);
    games[gameId] = { id: gameId, players: [socket.id] };
    broadcastGameList();
    if (cb) cb(gameId);
  });

  socket.on('joinGame', (gameId, cb) => {
    if (games[gameId] && games[gameId].players.length < 2) {
      games[gameId].players.push(socket.id);
      broadcastGameList();
      if (cb) cb(true);
    } else if (cb) {
      cb(false);
    }
  });

  socket.on('disconnect', () => {
    Object.values(games).forEach((game) => {
      game.players = game.players.filter((pid) => pid !== socket.id);
    });

    Object.keys(games).forEach((id) => {
      if (games[id].players.length === 0) delete games[id];
    });

    broadcastGameList();
    console.log('User disconnected:', socket.id);
  });

  socket.on('authenticate', (token) => {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production');
      socket.userId = decoded.userId;
      socket.username = decoded.username;
    } catch (err) {
      socket.disconnect(true);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Auth endpoints at http://localhost:${PORT}/api/auth`);
  console.log('Socket.IO server running');
});
