const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware (think of these as "helpers")
app.use(cors());           // Allows frontend to talk to backend
app.use(express.json());   // Understands JSON data from frontend

// Your first API route (like a function the frontend can call)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Règle de Trois API is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Game status route (we'll use this later)
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
});
