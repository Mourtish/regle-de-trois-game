import { useState, useEffect } from 'react'
import './App.css'

// Define what data we expect from the backend
interface ApiResponse {
  message: string;
  status: string;
  timestamp: string;
}

interface GameStatus {
  message: string;
  players_online: number;
  games_active: number;
}

function App() {
  // State to store data from backend
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from backend
  const fetchData = async () => {
    try {
      // Call your backend API
      const response = await fetch('http://localhost:3001/');
      const data = await response.json();
      setApiData(data);

      // Call game status endpoint
      const gameResponse = await fetch('http://localhost:3001/api/game/status');
      const gameData = await gameResponse.json();
      setGameStatus(gameData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Run fetchData when component loads
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Connecting to game server...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 Règle de Trois</h1>
        <p>Traditional Senegalese Board Game</p>
        
        {/* Display backend data */}
        {apiData && (
          <div className="api-status">
            <h3>Server Status</h3>
            <p>✅ {apiData.message}</p>
            <p>Status: {apiData.status}</p>
            <p>Connected at: {new Date(apiData.timestamp).toLocaleTimeString()}</p>
          </div>
        )}

        {/* Display game status */}
        {gameStatus && (
          <div className="game-status">
            <h3>Game Status</h3>
            <p>👥 Players Online: {gameStatus.players_online}</p>
            <p>🎮 Active Games: {gameStatus.games_active}</p>
          </div>
        )}

        <button onClick={fetchData} className="refresh-btn">
          🔄 Refresh Status
        </button>
      </header>
    </div>
  );
}

export default App;
