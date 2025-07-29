import { useState, useEffect } from 'react'
import GameBoard from './components/game/GameBoard'
import './App.css'

// Define what data we expect from the backend
interface ApiResponse {
  message: string;
  status: string;
  timestamp: string;
}

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from backend
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/');
      const data = await response.json();
      setApiData(data);
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

  if (showGame) {
    return <GameBoard />;
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

        <div className="game-actions">
          <button 
            onClick={() => setShowGame(true)} 
            className="play-btn"
          >
            🎮 Play Game
          </button>
          
          <button onClick={fetchData} className="refresh-btn">
            🔄 Refresh Status
          </button>
        </div>

        <div className="project-info">
          <h3>About This Project</h3>
          <p>A modern implementation of traditional Senegalese strategy game</p>
          <p>Built with React, TypeScript, and Node.js</p>
        </div>
      </header>
    </div>
  );
}

export default App;
