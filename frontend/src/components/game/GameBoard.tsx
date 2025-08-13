import React, { useState, useEffect } from 'react';

// Define the board positions (3x3 grid with diagonals)
type Position = {
  id: number;
  x: number;
  y: number;
  connections: number[];
};

// Define game modes
type GameMode = 'human-vs-human' | 'human-vs-ai';

// Define game state
type GameState = {
  board: (null | 'player1' | 'player2')[];
  currentPlayer: 'player1' | 'player2';
  phase: 'placement' | 'movement';
  selectedPosition: number | null;
  player1Pawns: number;
  player2Pawns: number;
  winner: string | null;
  player1Color: string;
  player2Color: string;
  player1Name: string;
  player2Name: string;
  gameMode: GameMode;
  isAiThinking: boolean;
  animatingMove: { from: number; to: number } | null;
};

// Animation state for pawns
type PawnAnimation = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
};

interface GameBoardProps {
  onReturn: () => void;
  showAuthButton?: boolean;
  onShowAuth?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ onReturn, showAuthButton, onShowAuth }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'player1',
    phase: 'placement',
    selectedPosition: null,
    player1Pawns: 3,
    player2Pawns: 3,
    winner: null,
    player1Color: '#ff4444',
    player2Color: '#4444ff',
    player1Name: 'You',
    player2Name: 'AI Opponent',
    gameMode: 'human-vs-ai',
    isAiThinking: false,
    animatingMove: null,
  });

  const [animations, setAnimations] = useState<PawnAnimation[]>([]);

  // Define board positions (3x3 grid layout)
  const positions: Position[] = [
    { id: 0, x: 100, y: 100, connections: [1, 3, 4] },
    { id: 1, x: 200, y: 100, connections: [0, 2, 4] },
    { id: 2, x: 300, y: 100, connections: [1, 5, 4] },
    { id: 3, x: 100, y: 200, connections: [0, 4, 6] },
    { id: 4, x: 200, y: 200, connections: [0, 1, 2, 3, 5, 6, 7, 8] },
    { id: 5, x: 300, y: 200, connections: [2, 4, 8] },
    { id: 6, x: 100, y: 300, connections: [3, 4, 7] },
    { id: 7, x: 200, y: 300, connections: [6, 4, 8] },
    { id: 8, x: 300, y: 300, connections: [5, 4, 7] },
  ];

  // AI Logic using Minimax Algorithm
  const evaluateBoard = (board: (null | 'player1' | 'player2')[]): number => {
    const winner = checkWinner(board);
    if (winner === 'player2') return 10; // AI wins
    if (winner === 'player1') return -10; // Human wins
    return 0; // Draw or ongoing
  };

  const minimax = (
    board: (null | 'player1' | 'player2')[],
    depth: number,
    isMaximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity
  ): number => {
    const score = evaluateBoard(board);
    
    if (score !== 0 || depth === 0) return score;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'player2';
          const evaluation = minimax(board, depth - 1, false, alpha, beta);
          board[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'player1';
          const evaluation = minimax(board, depth - 1, true, alpha, beta);
          board[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  };

  const getAIMove = (board: (null | 'player1' | 'player2')[], phase: 'placement' | 'movement'): { from?: number; to: number } | null => {
    if (phase === 'placement') {
      // AI placement strategy
      let bestMove = -1;
      let bestValue = -Infinity;

      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'player2';
          const moveValue = minimax(board, 3, false);
          board[i] = null;

          if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = i;
          }
        }
      }

      return bestMove !== -1 ? { to: bestMove } : null;
    } else {
      // AI movement strategy
      let bestMove: { from: number; to: number } | null = null;
      let bestValue = -Infinity;

      for (let from = 0; from < 9; from++) {
        if (board[from] === 'player2') {
          for (const to of positions[from].connections) {
            if (board[to] === null) {
              // Simulate move
              board[to] = board[from];
              board[from] = null;
              
              const moveValue = minimax(board, 3, false);
              
              // Undo move
              board[from] = board[to];
              board[to] = null;

              if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = { from, to };
              }
            }
          }
        }
      }

      return bestMove;
    }
  };

  // Animation system
  const animateMove = (from: number, to: number, callback: () => void) => {
    const fromPos = positions[from];
    const toPos = positions[to];
    
    const animationId = `move-${Date.now()}`;
    const newAnimation: PawnAnimation = {
      id: animationId,
      fromX: fromPos.x,
      fromY: fromPos.y,
      toX: toPos.x,
      toY: toPos.y,
      progress: 0,
    };

    setAnimations(prev => [...prev, newAnimation]);
    setGameState(prev => ({ ...prev, animatingMove: { from, to } }));

    const duration = 500; // 500ms animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimations(prev => 
        prev.map(anim => 
          anim.id === animationId 
            ? { ...anim, progress: easeInOutCubic(progress) }
            : anim
        )
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        setAnimations(prev => prev.filter(anim => anim.id !== animationId));
        setGameState(prev => ({ ...prev, animatingMove: null }));
        callback();
      }
    };

    requestAnimationFrame(animate);
  };

  // Easing function for smooth animation
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  // AI Turn Handler
  useEffect(() => {
    if (gameState.gameMode === 'human-vs-ai' && 
        gameState.currentPlayer === 'player2' && 
        !gameState.winner && 
        !gameState.isAiThinking &&
        !gameState.animatingMove) {
      
      setGameState(prev => ({ ...prev, isAiThinking: true }));
      
      // Add delay for realistic AI "thinking" time
      setTimeout(() => {
        const aiMove = getAIMove(gameState.board, gameState.phase);
        
        if (aiMove) {
          if (gameState.phase === 'placement') {
            handlePlacement(aiMove.to, true);
          } else if (aiMove.from !== undefined) {
            // AI movement with animation
            const newBoard = [...gameState.board];
            newBoard[aiMove.to] = newBoard[aiMove.from];
            newBoard[aiMove.from] = null;

            animateMove(aiMove.from, aiMove.to, () => {
              const winner = checkWinner(newBoard);
              setGameState(prev => ({
                ...prev,
                board: newBoard,
                currentPlayer: 'player1',
                winner: winner,
                isAiThinking: false,
              }));
            });
          }
        } else {
          setGameState(prev => ({ ...prev, isAiThinking: false }));
        }
      }, 800 + Math.random() * 1200); // Random thinking time between 0.8-2s
    }
  }, [gameState.currentPlayer, gameState.phase, gameState.isAiThinking, gameState.animatingMove]);

  // Handle clicking on a position
  const handlePositionClick = (positionId: number) => {
    if (gameState.winner || gameState.isAiThinking || gameState.animatingMove) return;
    if (gameState.gameMode === 'human-vs-ai' && gameState.currentPlayer === 'player2') return;

    if (gameState.phase === 'placement') {
      handlePlacement(positionId, false);
    } else {
      handleMovement(positionId);
    }
  };

  // Handle placing pawns
  const handlePlacement = (positionId: number, isAI: boolean) => {
    if (gameState.board[positionId] !== null) return;

    const newBoard = [...gameState.board];
    newBoard[positionId] = gameState.currentPlayer;

    const newState = { ...gameState, board: newBoard };

    if (gameState.currentPlayer === 'player1') {
      newState.player1Pawns -= 1;
    } else {
      newState.player2Pawns -= 1;
    }

    if (newState.player1Pawns === 0 && newState.player2Pawns === 0) {
      newState.phase = 'movement';
    }

    newState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';

    const winner = checkWinner(newBoard);
    if (winner) {
      newState.winner = winner;
    }

    if (isAI) {
      newState.isAiThinking = false;
    }

    setGameState(newState);
  };

  // Handle moving pawns
  const handleMovement = (positionId: number) => {
    if (gameState.selectedPosition === null) {
      if (gameState.board[positionId] === gameState.currentPlayer) {
        setGameState({ ...gameState, selectedPosition: positionId });
      }
    } else {
      const fromPos = gameState.selectedPosition;
      const toPos = positionId;

      if (isValidMove(fromPos, toPos)) {
        const newBoard = [...gameState.board];
        newBoard[toPos] = newBoard[fromPos];
        newBoard[fromPos] = null;

        animateMove(fromPos, toPos, () => {
          const winner = checkWinner(newBoard);
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            selectedPosition: null,
            currentPlayer: prev.currentPlayer === 'player1' ? 'player2' : 'player1',
            winner: winner,
          }));
        });
      } else {
        setGameState({ ...gameState, selectedPosition: null });
      }
    }
  };

  // Check if a move is valid
  const isValidMove = (from: number, to: number): boolean => {
    if (gameState.board[to] !== null) return false;
    return positions[from].connections.includes(to);
  };

  // Check for winner
  const checkWinner = (board: (null | 'player1' | 'player2')[]): string | null => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
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
      ...gameState,
      board: Array(9).fill(null),
      currentPlayer: 'player1',
      phase: 'placement',
      selectedPosition: null,
      player1Pawns: 3,
      player2Pawns: 3,
      winner: null,
      isAiThinking: false,
      animatingMove: null,
    });
    setAnimations([]);
  };

  // Toggle game mode
  const toggleGameMode = () => {
    const newMode: GameMode = gameState.gameMode === 'human-vs-ai' ? 'human-vs-human' : 'human-vs-ai';
    setGameState({
      ...gameState,
      gameMode: newMode,
      player2Name: newMode === 'human-vs-ai' ? 'AI Opponent' : 'Player 2',
    });
    resetGame();
  };

  // Handle color changes
  const handleColorChange = (player: 'player1' | 'player2', color: string) => {
    setGameState({ ...gameState, [`${player}Color`]: color });
  };

  // Handle name changes
  const handleNameChange = (player: 'player1' | 'player2', name: string) => {
    setGameState({ ...gameState, [`${player}Name`]: name });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      position: 'relative'
    }}>
      {/* Return Button */}
      <button
        onClick={onReturn}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          padding: '10px 18px',
          background: '#eee',
          border: '1px solid #ccc',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        ⬅️ Return
      </button>

      {/* Auth Button for guests */}
      {showAuthButton && onShowAuth && (
        <button
          onClick={onShowAuth}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            zIndex: 10,
            padding: '4px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            fontSize: '0.95em',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
          }}
        >
          🔐 Login
        </button>
      )}
      {/* Game Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>🌟 Règle de Trois</h1>
        <p style={{ margin: '0', opacity: '0.9' }}>
          {gameState.gameMode === 'human-vs-ai' ? 'Challenge the AI!' : 'Two Player Mode'}
        </p>
      </div>

      {/* Game Mode Toggle */}
      <button
        onClick={toggleGameMode}
        style={{
          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
          color: 'white',
          border: 'none',
          padding: '12px 25px',
          borderRadius: '25px',
          fontSize: '1.1em',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.3s ease'
        }}
      >
        {gameState.gameMode === 'human-vs-ai' ? '🤖 AI Mode' : '👥 2-Player Mode'}
      </button>

      {/* Player Setup */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Player 1 Setup */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '15px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          minWidth: '250px'
        }}>
          <h3>👤 {gameState.player1Name}</h3>
          {gameState.gameMode === 'human-vs-human' && (
            <input
              type="text"
              value={gameState.player1Name}
              onChange={(e) => handleNameChange('player1', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '16px'
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Color:</label>
            <input
              type="color"
              value={gameState.player1Color}
              onChange={(e) => handleColorChange('player1', e.target.value)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none' }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            Status: {gameState.phase === 'placement' ? `${gameState.player1Pawns} pawns to place` : 'Ready to move'}
          </div>
        </div>

        {/* Player 2/AI Setup */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '15px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          minWidth: '250px'
        }}>
          <h3>{gameState.gameMode === 'human-vs-ai' ? '🤖' : '👤'} {gameState.player2Name}</h3>
          {gameState.gameMode === 'human-vs-human' && (
            <input
              type="text"
              value={gameState.player2Name}
              onChange={(e) => handleNameChange('player2', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '16px'
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Color:</label>
            <input
              type="color"
              value={gameState.player2Color}
              onChange={(e) => handleColorChange('player2', e.target.value)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none' }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            {gameState.isAiThinking ? '🤔 AI is thinking...' : 
             gameState.phase === 'placement' ? `${gameState.player2Pawns} pawns to place` : 'Ready to move'}
          </div>
        </div>
      </div>

      {/* Current Player Indicator */}
      <div style={{
        background: gameState.currentPlayer === 'player1' ? gameState.player1Color : gameState.player2Color,
        color: 'white',
        padding: '15px 30px',
        borderRadius: '25px',
        fontSize: '1.2em',
        fontWeight: 'bold',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        opacity: gameState.isAiThinking ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        {gameState.winner ? (
          `🎉 ${gameState.winner === 'player1' ? gameState.player1Name : gameState.player2Name} Wins!`
        ) : gameState.isAiThinking ? (
          '🤖 AI is thinking...'
        ) : (
          `${gameState.currentPlayer === 'player1' ? gameState.player1Name : gameState.player2Name}'s Turn`
        )}
      </div>

      {/* Game Board */}
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '30px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <svg width="400" height="400" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
          {/* Draw the square outline */}
          <rect x="100" y="100" width="200" height="200" fill="none" stroke="#333" strokeWidth="3"/>
          
          {/* Draw lines */}
          <line x1="100" y1="200" x2="300" y2="200" stroke="#333" strokeWidth="2"/>
          <line x1="200" y1="100" x2="200" y2="300" stroke="#333" strokeWidth="2"/>
          <line x1="100" y1="100" x2="300" y2="300" stroke="#333" strokeWidth="2"/>
          <line x1="300" y1="100" x2="100" y2="300" stroke="#333" strokeWidth="2"/>

          {/* Draw static positions */}
          {positions.map((pos) => (
            <circle
              key={`static-${pos.id}`}
              cx={pos.x}
              cy={pos.y}
              r="25"
              fill={
                gameState.animatingMove?.from === pos.id ? 'transparent' :
                gameState.board[pos.id] === 'player1' ? gameState.player1Color :
                gameState.board[pos.id] === 'player2' ? gameState.player2Color :
                '#ffffff'
              }
              stroke={gameState.selectedPosition === pos.id ? '#00ff00' : '#333'}
              strokeWidth={gameState.selectedPosition === pos.id ? '4' : '3'}
              style={{ 
                cursor: gameState.isAiThinking || gameState.animatingMove ? 'wait' : 'pointer',
                filter: gameState.selectedPosition === pos.id ? 'drop-shadow(0 0 10px #00ff00)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handlePositionClick(pos.id)}
            />
          ))}

          {/* Draw animated pawns */}
          {animations.map((anim) => {
            const currentX = anim.fromX + (anim.toX - anim.fromX) * anim.progress;
            const currentY = anim.fromY + (anim.toY - anim.fromY) * anim.progress;
            
            return (
              <circle
                key={anim.id}
                cx={currentX}
                cy={currentY}
                r="25"
                fill={gameState.player2Color}
                stroke="#333"
                strokeWidth="3"
                style={{
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Game Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button
          onClick={resetGame}
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '25px',
            fontSize: '1.1em',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255,107,107,0.3)'
          }}
        >
          🔄 New Game
        </button>
      </div>

      {/* Game Instructions */}
      <div style={{
        marginTop: '30px',
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        textAlign: 'left'
      }}>
        <h3>📖 How to Play</h3>
        <div style={{ lineHeight: '1.6' }}>
          <strong>Phase 1 - Placement:</strong> Take turns placing your 3 pawns on any empty intersection.<br/>
          <strong>Phase 2 - Movement:</strong> Move your pawns along the lines to adjacent intersections.<br/>
          <strong>Goal:</strong> Get 3 of your pawns in a row (horizontal, vertical, or diagonal) to win!<br/>
          <strong>AI Mode:</strong> Challenge our smart AI opponent with varying difficulty levels.
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
