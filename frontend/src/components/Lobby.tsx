import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../utils/api';

interface Game {
  id: string;
  players: number;
}

const Lobby: React.FC<{ onJoinGame: (gameId: string) => void }> = ({ onJoinGame }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const s = io(API_URL, { withCredentials: true, transports: ['websocket'] });
    setSocket(s);

    s.on('gameList', (gameList: Game[]) => {
      setGames(gameList);
    });

    s.emit('getGames');

    return () => {
      s.disconnect();
    };
  }, []);

  const handleCreateGame = () => {
    if (socket) {
      setCreating(true);
      socket.emit('createGame', (gameId: string) => {
        setCreating(false);
        onJoinGame(gameId);
      });
    }
  };

  const handleJoinGame = (gameId: string) => {
    onJoinGame(gameId);
  };

  return (
    <div className="lobby-container">
      <h2>Lobby</h2>
      <button onClick={handleCreateGame} disabled={creating}>
        {creating ? 'Creating...' : 'Create New Game'}
      </button>
      <h3>Available Games</h3>
      <ul>
        {games.length === 0 && <li>No games available</li>}
        {games.map((game) => (
          <li key={game.id}>
            Game {game.id} ({game.players} player{game.players !== 1 ? 's' : ''})
            <button onClick={() => handleJoinGame(game.id)} style={{ marginLeft: 8 }}>
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
