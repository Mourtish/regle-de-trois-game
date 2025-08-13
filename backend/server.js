const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes('github.dev') ||
        origin.includes('apn.github.dev') ||
        origin.startsWith('http://localhost:5173')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

// CORS middleware FIRST
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes('github.dev') ||
      origin.includes('apn.github.dev') ||
      origin.startsWith('http://localhost:5173')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regle-de-trois', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('📦 Connected to MongoDB'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Your existing routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Règle de Trois API is running!',
    status: 'success',
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


// --- Multiplayer Lobby State ---
let games = {};
function broadcastGameList() {
  const gameList = Object.values(games).map(g => ({ id: g.id, players: g.players.length }));
  io.emit('gameList', gameList);
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send current game list
  socket.on('getGames', () => {
    broadcastGameList();
  });

  // Create a new game
  socket.on('createGame', (cb) => {
    const gameId = Math.random().toString(36).substr(2, 6);
    games[gameId] = { id: gameId, players: [socket.id] };
    broadcastGameList();
    if (cb) cb(gameId);
  });

  // Join a game
  socket.on('joinGame', (gameId, cb) => {
    if (games[gameId] && games[gameId].players.length < 2) {
      games[gameId].players.push(socket.id);
      broadcastGameList();
      if (cb) cb(true);
    } else {
      if (cb) cb(false);
    }
  });

  // Leave all games on disconnect
  socket.on('disconnect', () => {
    Object.values(games).forEach(game => {
      game.players = game.players.filter(pid => pid !== socket.id);
    });
    // Remove empty games
    Object.keys(games).forEach(id => {
      if (games[id].players.length === 0) delete games[id];
    });
    broadcastGameList();
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API accessible at http://localhost:${PORT}`);
  console.log(`�� Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🕹️  Socket.IO server running!`);
});