import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from './utils/api';
import GameBoard from './components/game/GameBoard'
import Lobby from './components/Lobby';
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
  const [inLobby, setInLobby] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  // Socket.IO test connection
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server!', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // For showing AuthModal on the board
  const [showBoardAuth, setShowBoardAuth] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure user has the expected shape
        const normalizedUser: User = {
          id: parsedUser.id,
          username: parsedUser.username,
          profile: parsedUser.profile || {
            displayName: parsedUser.displayName || parsedUser.username,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + parsedUser.username,
            preferredColor: '#4444ff'
          },
          gameStats: parsedUser.gameStats || {
            gamesPlayed: parsedUser.gamesPlayed || 0,
            gamesWon: parsedUser.gamesWon || 0,
            gamesLost: 0,
            winStreak: 0,
            bestWinStreak: 0
          }
        };
        setUser(normalizedUser);
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

  if (inLobby) {
    return (
      <>
        <button
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 100,
            padding: '10px 18px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
          onClick={() => setInLobby(false)}
        >
          ⬅️ Back to Home
        </button>
        <Lobby
          onJoinGame={(gameId) => {
            setCurrentGameId(gameId);
            setInLobby(false);
            setShowGame(true);
          }}
        />
      </>
    );
  }

  if (showGame) {
    return (
      <>
        <GameBoard 
          onReturn={() => {
            setShowGame(false);
            setInLobby(true);
            setCurrentGameId(null);
          }}
          showAuthButton={!user}
          onShowAuth={() => setShowBoardAuth(true)}
          // gameId={currentGameId}
        />
        <AuthModal
          isOpen={showBoardAuth}
          onClose={() => setShowBoardAuth(false)}
          onAuthSuccess={(userData) => {
            setUser(userData);
            setShowBoardAuth(false);
          }}
        />
      </>
    );
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
            <h3>🎮 Welcome!</h3>
            <p>You can play as a guest or register to track your progress and compete!</p>
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
          <button
            onClick={() => setInLobby(true)}
            className="lobby-btn"
            style={{ marginBottom: 12 }}
          >
            🧑‍🤝‍🧑 Multiplayer Lobby
          </button>
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
            <>
              <button 
                onClick={() => setShowGame(true)} 
                className="play-btn"
              >
                🎮 Play as Guest
              </button>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="auth-btn"
              >
                🔐 Login / Register
              </button>
            </>
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
