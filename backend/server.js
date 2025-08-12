
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow Codespaces frontend URLs or localhost
    if (
      !origin ||
      origin.includes('github.dev') ||
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API accessible at http://localhost:${PORT}`);
  console.log(`�� Auth endpoints: http://localhost:${PORT}/api/auth`);
});
