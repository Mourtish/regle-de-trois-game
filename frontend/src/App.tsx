import { useState, useEffect } from 'react';
import { API_URL } from './utils/api';
import GameBoard from './components/game/GameBoard'
import AuthModal from './components/auth/AuthModal'
import './App.css'

// Define what data we expect from the backend
interface ApiResponse {
  message: string;
  status: string;
  timestamp: string;
  database: string;
}

interface User {
  id: string;
  username: string;
  profile: {
    displayName: string;
    avatar: string;
    preferredColor: string;
  };
  gameStats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winStreak: number;
    bestWinStreak: number;
  };
}

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    
    fetchData();
  }, []);

  // Function to fetch data from backend
  const fetchData = async () => {
    try {
  const response = await fetch(API_URL + '/');
      const data = await response.json();
      setApiData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setShowGame(false);
  };

  if (loading) {
    return <div className="loading">Connecting to game server...</div>;
  }

  if (showGame && user) {
    return <GameBoard />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 Règle de Trois</h1>
        <p>Traditional Senegalese Board Game</p>
        
        {/* User Status */}
        {user ? (
          <div className="user-info">
            <h3>Welcome back, {user.profile.displayName}! 👋</h3>
            <div className="user-stats">
              <span>🎮 Games: {user.gameStats.gamesPlayed}</span>
              <span>🏆 Wins: {user.gameStats.gamesWon}</span>
              <span>🔥 Win Streak: {user.gameStats.winStreak}</span>
            </div>
          </div>
        ) : (
          <div className="auth-prompt">
            <h3>🎮 Ready to Play?</h3>
            <p>Login or create an account to track your progress and compete!</p>
          </div>
        )}
        
        {/* Display backend data */}
        {apiData && (
          <div className="api-status">
            <h3>Server Status</h3>
            <p>✅ {apiData.message}</p>
            <p>Database: {apiData.database === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}</p>
            <p>Connected at: {new Date(apiData.timestamp).toLocaleTimeString()}</p>
          </div>
        )}

        <div className="game-actions">
          {user ? (
            <>
              <button 
                onClick={() => setShowGame(true)} 
                className="play-btn"
              >
                🎮 Play Game
              </button>
              <button 
                onClick={handleLogout}
                className="logout-btn"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="auth-btn"
            >
              🔐 Login / Register
            </button>
          )}
          
          <button onClick={fetchData} className="refresh-btn">
            🔄 Refresh Status
          </button>
        </div>

        <div className="project-info">
          <h3>About This Project</h3>
          <p>A modern implementation of traditional Senegalese strategy game</p>
          <p>Built with React, TypeScript, Node.js, and MongoDB Atlas</p>
          {user && <p>✅ Authenticated User Session Active</p>}
        </div>
      </header>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
