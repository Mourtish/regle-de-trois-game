import React, { useState } from 'react';
import './GameBoard.css';

// Define the board positions (intersection points)
type Position = {
  id: number;
  x: number;
  y: number;
  connections: number[]; // Which positions this connects to
};

// Define game state
type GameState = {
  board: (null | 'player1' | 'player2')[]; // 9 positions, null = empty
  currentPlayer: 'player1' | 'player2';
  phase: 'placement' | 'movement';
  selectedPosition: number | null;
  player1Pawns: number; // Pawns left to place
  player2Pawns: number;
  winner: string | null;
};

const GameBoard: React.FC = () => {
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'player1',
    phase: 'placement',
    selectedPosition: null,
    player1Pawns: 3,
    player2Pawns: 3,
    winner: null,
  });

  // Define board positions (star shape)
  const positions: Position[] = [
    { id: 0, x: 150, y: 50, connections: [1, 3, 4] },   // Top
    { id: 1, x: 250, y: 100, connections: [0, 2, 4] },  // Top right
    { id: 2, x: 250, y: 200, connections: [1, 4, 5] },  // Right
    { id: 3, x: 50, y: 100, connections: [0, 4, 6] },   // Top left
    { id: 4, x: 150, y: 150, connections: [0, 1, 2, 3, 5, 6, 7, 8] }, // Center
    { id: 5, x: 250, y: 200, connections: [2, 4, 8] },  // Bottom right
    { id: 6, x: 50, y: 200, connections: [3, 4, 7] },   // Left
    { id: 7, x: 50, y: 250, connections: [6, 4, 8] },   // Bottom left
    { id: 8, x: 150, y: 300, connections: [7, 4, 5] },  // Bottom
  ];

  // Handle clicking on a position
  const handlePositionClick = (positionId: number) => {
    if (gameState.winner) return; // Game over

    if (gameState.phase === 'placement') {
      handlePlacement(positionId);
    } else {
      handleMovement(positionId);
    }
  };

  // Handle placing pawns
  const handlePlacement = (positionId: number) => {
    // Can only place on empty positions
    if (gameState.board[positionId] !== null) return;

    const newBoard = [...gameState.board];
    newBoard[positionId] = gameState.currentPlayer;

    const newState = { ...gameState, board: newBoard };

    // Update pawn count
    if (gameState.currentPlayer === 'player1') {
      newState.player1Pawns -= 1;
    } else {
      newState.player2Pawns -= 1;
    }

    // Check if placement phase is over
    if (newState.player1Pawns === 0 && newState.player2Pawns === 0) {
      newState.phase = 'movement';
    }

    // Switch player
    newState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';

    // Check for winner
    const winner = checkWinner(newBoard);
    if (winner) {
      newState.winner = winner;
    }

    setGameState(newState);
  };

  // Handle moving pawns
  const handleMovement = (positionId: number) => {
    if (gameState.selectedPosition === null) {
      // Select a pawn to move (must be current player's pawn)
      if (gameState.board[positionId] === gameState.currentPlayer) {
        setGameState({ ...gameState, selectedPosition: positionId });
      }
    } else {
      // Move selected pawn
      const fromPos = gameState.selectedPosition;
      const toPos = positionId;

      // Check if move is valid
      if (isValidMove(fromPos, toPos)) {
        const newBoard = [...gameState.board];
        newBoard[toPos] = newBoard[fromPos];
        newBoard[fromPos] = null;

        const newState = {
          ...gameState,
          board: newBoard,
          selectedPosition: null,
          currentPlayer: gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
        };

        // Check for winner
        const winner = checkWinner(newBoard);
        if (winner) {
          newState.winner = winner;
        }

        setGameState(newState);
      } else {
        // Invalid move, deselect
        setGameState({ ...gameState, selectedPosition: null });
      }
    }
  };

  // Check if a move is valid
  const isValidMove = (from: number, to: number): boolean => {
    // Destination must be empty
    if (gameState.board[to] !== null) return false;

    // Must be connected positions
    return positions[from].connections.includes(to);
  };

  // Check for winner (3 in a row)
  const checkWinner = (board: (null | 'player1' | 'player2')[]): string | null => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
      [0, 4, 8], [2, 4, 6], // Diagonal
    ];

    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  // Reset game
  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'player1',
      phase: 'placement',
      selectedPosition: null,
      player1Pawns: 3,
      player2Pawns: 3,
      winner: null,
    });
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Règle de Trois</h2>
        <div className="player-info">
          <div className={`player ${gameState.currentPlayer === 'player1' ? 'active' : ''}`}>
            Player 1 (Red): {gameState.phase === 'placement' ? `${gameState.player1Pawns} to place` : 'Move your pawn'}
          </div>
          <div className={`player ${gameState.currentPlayer === 'player2' ? 'active' : ''}`}>
            Player 2 (Blue): {gameState.phase === 'placement' ? `${gameState.player2Pawns} to place` : 'Move your pawn'}
          </div>
        </div>
        <div className="phase-info">
          Phase: {gameState.phase === 'placement' ? 'Placing Pawns' : 'Moving Pawns'}
        </div>
        {gameState.winner && (
          <div className="winner">
            🎉 {gameState.winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!
          </div>
        )}
      </div>

      <div className="board-container">
        <svg width="300" height="350" className="game-board">
          {/* Draw connecting lines */}
          {positions.map((pos) =>
            pos.connections.map((connId) => (
              <line
                key={`${pos.id}-${connId}`}
                x1={pos.x}
                y1={pos.y}
                x2={positions[connId].x}
                y2={positions[connId].y}
                stroke="#333"
                strokeWidth="2"
              />
            ))
          )}

          {/* Draw positions */}
          {positions.map((pos) => (
            <circle
              key={pos.id}
              cx={pos.x}
              cy={pos.y}
              r="20"
              fill={
                gameState.board[pos.id] === 'player1'
                  ? '#ff4444'
                  : gameState.board[pos.id] === 'player2'
                  ? '#4444ff'
                  : '#ffffff'
              }
              stroke={gameState.selectedPosition === pos.id ? '#00ff00' : '#333'}
              strokeWidth={gameState.selectedPosition === pos.id ? '4' : '2'}
              className="position"
              onClick={() => handlePositionClick(pos.id)}
            />
          ))}
        </svg>
      </div>

      <button onClick={resetGame} className="reset-btn">
        🔄 New Game
      </button>
    </div>
  );
};

export default GameBoard;
