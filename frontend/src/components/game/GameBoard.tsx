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

  // ─── helpers for pawn inventory display ────────────────────────────────────
  const pawnsOnBoard = (player: 'player1' | 'player2') =>
    gameState.board.filter(c => c === player).length;

  const PawnInventory = ({ player }: { player: 'player1' | 'player2' }) => {
    const color      = player === 'player1' ? gameState.player1Color : gameState.player2Color;
    const inHand     = player === 'player1' ? gameState.player1Pawns : gameState.player2Pawns;
    const placed     = pawnsOnBoard(player);
    const isPlacement = gameState.phase === 'placement';

    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {Array.from({ length: 3 }).map((_, i) => {
          // During placement: first `placed` are on board (dim), rest in hand (full)
          // During movement: count directly from board
          const onBoard = isPlacement ? i < placed : i < placed;
          return (
            <div
              key={i}
              title={onBoard ? 'On board' : 'In hand'}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: onBoard
                  ? 'transparent'
                  : `radial-gradient(circle at 35% 35%, ${color}ff, ${color}99)`,
                border: `3px solid ${color}`,
                boxShadow: onBoard
                  ? 'none'
                  : `0 0 10px ${color}88, inset 0 1px 2px rgba(255,255,255,0.3)`,
                transition: 'all 0.4s ease',
                opacity: onBoard ? 0.35 : 1,
              }}
            />
          );
        })}
        {isPlacement && (
          <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.6)' }}>
            {inHand} left
          </span>
        )}
      </div>
    );
  };

  const activeColor = gameState.currentPlayer === 'player1'
    ? gameState.player1Color
    : gameState.player2Color;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px 40px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: 'linear-gradient(160deg, #060621 0%, #0b1640 45%, #091232 100%)',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
    }}>

      {/* — keyframe animations injected via style tag — */}
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes winner-glow {
          0%, 100% { text-shadow: 0 0 20px #ffd700, 0 0 40px #ffa500; }
          50%       { text-shadow: 0 0 40px #ffd700, 0 0 80px #ff8c00; }
        }
        @keyframes thinking-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', maxWidth: 620, marginBottom: 20,
      }}>
        <button
          onClick={onReturn}
          style={{
            padding: '8px 18px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, color: 'white', fontWeight: 600,
            cursor: 'pointer', fontSize: '0.9em', backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseOut={e  => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          ← Back
        </button>

        {/* Mode pill toggle */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 30, padding: '4px',
          display: 'flex', border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {(['human-vs-ai', 'human-vs-human'] as const).map(mode => (
            <button key={mode} onClick={() => { if (gameState.gameMode !== mode) toggleGameMode(); }} style={{
              padding: '7px 16px', borderRadius: 26, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.82em', transition: 'all 0.25s',
              background: gameState.gameMode === mode
                ? 'linear-gradient(135deg, #1e90ff, #0060cc)'
                : 'transparent',
              color: gameState.gameMode === mode ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: gameState.gameMode === mode ? '0 2px 10px #1e90ff66' : 'none',
            }}>
              {mode === 'human-vs-ai' ? '🤖 vs AI' : '👥 2 Players'}
            </button>
          ))}
        </div>

        {showAuthButton && onShowAuth ? (
          <button onClick={onShowAuth} style={{
            padding: '8px 14px', background: 'linear-gradient(135deg, #00b894, #00a381)',
            border: 'none', borderRadius: 10, color: 'white', fontWeight: 600,
            cursor: 'pointer', fontSize: '0.88em',
            boxShadow: '0 2px 10px #00b89455',
          }}>
            🔐 Login
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h1 style={{
        margin: '0 0 4px', fontSize: '2em', letterSpacing: 1,
        background: 'linear-gradient(90deg, #7eb8ff, #a78bfa, #7eb8ff)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Règle de Trois
      </h1>
      <p style={{ margin: '0 0 22px', fontSize: '0.85em', color: 'rgba(255,255,255,0.45)', letterSpacing: 2 }}>
        TRADITIONAL SENEGALESE STRATEGY
      </p>

      {/* ── Phase badge ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 18px', borderRadius: 20, marginBottom: 18,
        background: gameState.phase === 'placement'
          ? 'linear-gradient(135deg, #f39c12, #e67e22)'
          : 'linear-gradient(135deg, #1e90ff, #0055c4)',
        fontSize: '0.82em', fontWeight: 700, letterSpacing: 1.5,
        boxShadow: gameState.phase === 'placement'
          ? '0 0 18px #f39c1255'
          : '0 0 18px #1e90ff55',
        animation: 'slide-in 0.3s ease',
      }}>
        {gameState.phase === 'placement' ? '📍 PLACEMENT PHASE' : '🎯 MOVEMENT PHASE'}
      </div>

      {/* ── Player cards (pawn inventory) ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, width: '100%', maxWidth: 560, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(['player1', 'player2'] as const).map(player => {
          const isP1      = player === 'player1';
          const color     = isP1 ? gameState.player1Color : gameState.player2Color;
          const name      = isP1 ? gameState.player1Name  : gameState.player2Name;
          const isActive  = gameState.currentPlayer === player && !gameState.winner;
          const isAI      = !isP1 && gameState.gameMode === 'human-vs-ai';

          return (
            <div key={player} style={{
              flex: 1, minWidth: 200, maxWidth: 260,
              background: isActive
                ? `linear-gradient(135deg, ${color}22, ${color}08)`
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${isActive ? color + '88' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16, padding: '14px 18px',
              backdropFilter: 'blur(8px)',
              boxShadow: isActive ? `0 0 20px ${color}33` : 'none',
              transition: 'all 0.35s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95em' }}>
                  {isAI ? '🤖' : '👤'} {name}
                </span>
                {/* color picker */}
                <input
                  type="color" value={color}
                  onChange={e => handleColorChange(player, e.target.value)}
                  title="Pick color"
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                />
              </div>

              {/* Name edit for 2-player mode */}
              {gameState.gameMode === 'human-vs-human' && (
                <input
                  type="text" value={name}
                  onChange={e => handleNameChange(player, e.target.value)}
                  style={{
                    width: '100%', padding: '5px 8px', marginBottom: 8,
                    borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: '0.85em',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {/* Pawn inventory */}
              <PawnInventory player={player} />
            </div>
          );
        })}
      </div>

      {/* ── Turn / Winner indicator ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 26px', borderRadius: 28, marginBottom: 22,
        background: gameState.winner
          ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
          : `linear-gradient(135deg, ${activeColor}dd, ${activeColor}99)`,
        color: gameState.winner ? '#1a0a00' : 'white',
        fontWeight: 700, fontSize: '1.05em',
        boxShadow: gameState.winner
          ? '0 4px 20px #ffd70088'
          : `0 4px 20px ${activeColor}55`,
        animation: gameState.winner ? 'winner-glow 1.5s infinite ease-in-out' : 'none',
        transition: 'background 0.4s, box-shadow 0.4s',
      }}>
        {gameState.winner ? (
          <>🏆 {gameState.winner === 'player1' ? gameState.player1Name : gameState.player2Name} wins!</>
        ) : gameState.isAiThinking ? (
          <>
            🤖 AI thinking
            {[0,1,2].map(i => (
              <span key={i} style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: 'white', marginLeft: 3,
                animation: `thinking-dot 1.2s ${i*0.2}s infinite ease-in-out`,
              }} />
            ))}
          </>
        ) : (
          <>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: activeColor,
              boxShadow: `0 0 0 0 ${activeColor}44`,
              animation: 'pulse-ring 1.6s infinite',
              display: 'inline-block', border: '2px solid rgba(255,255,255,0.7)',
            }}/>
            {gameState.currentPlayer === 'player1' ? gameState.player1Name : gameState.player2Name}'s
            {' '}{gameState.phase === 'placement' ? 'placement' : 'move'}
          </>
        )}
      </div>

      {/* ── Game Board ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(14, 30, 80, 0.7)',
        padding: 28, borderRadius: 24,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,144,255,0.15)',
        position: 'relative',
      }}>
        <svg width="400" height="400" viewBox="30 30 340 340" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ─ Board lines ─────────────────────────────────────────────── */}
          {[
            // rows
            [100,100,300,100], [100,200,300,200], [100,300,300,300],
            // cols
            [100,100,100,300], [200,100,200,300], [300,100,300,300],
            // diagonals through center
            [100,100,300,300], [300,100,100,300],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#1e90ff" strokeWidth="2.5" opacity="0.6"
              filter="url(#line-glow)"
              strokeLinecap="round"
            />
          ))}

          {/* ─ Nodes ────────────────────────────────────────────────────── */}
          {positions.map((pos) => {
            const owner   = gameState.board[pos.id];
            const isHiding = gameState.animatingMove?.from === pos.id;
            const isSelected = gameState.selectedPosition === pos.id;
            const nodeColor = owner === 'player1' ? gameState.player1Color
                            : owner === 'player2' ? gameState.player2Color
                            : null;
            const canClick = !gameState.winner && !gameState.isAiThinking && !gameState.animatingMove
                          && !(gameState.gameMode === 'human-vs-ai' && gameState.currentPlayer === 'player2');

            return (
              <g key={pos.id} onClick={() => handlePositionClick(pos.id)}
                style={{ cursor: canClick ? 'pointer' : 'default' }}>
                {/* outer ring when selected */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={34}
                    fill="none" stroke="#00ff88" strokeWidth="2.5" opacity={0.7}
                    style={{ animation: 'pulse-ring 1s infinite' }}
                  />
                )}
                {/* node background */}
                <circle cx={pos.x} cy={pos.y} r={24}
                  fill={isHiding ? 'transparent'
                      : nodeColor
                        ? `radial-gradient(circle at 35% 35%, ${nodeColor}ff, ${nodeColor}bb)`
                        : 'rgba(8, 20, 70, 0.85)'}
                  stroke={
                    isSelected
                      ? '#00ff88'
                      : nodeColor
                        ? nodeColor
                        : 'rgba(30,144,255,0.45)'
                  }
                  strokeWidth={isSelected ? 3 : 2}
                  filter={nodeColor ? 'url(#node-glow)' : 'none'}
                  style={{ transition: 'all 0.25s ease' }}
                />
                {/* pawn shine */}
                {nodeColor && !isHiding && (
                  <ellipse cx={pos.x - 7} cy={pos.y - 7} rx={7} ry={4}
                    fill="rgba(255,255,255,0.25)" style={{ pointerEvents: 'none' }}
                  />
                )}
                {/* node number hint (faint) */}
                {!nodeColor && !isHiding && (
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                    fontSize="11" fill="rgba(100,160,255,0.25)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {pos.id + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* ─ Animated pawn during movement ──────────────────────────── */}
          {animations.map((anim) => {
            const currentX = anim.fromX + (anim.toX - anim.fromX) * anim.progress;
            const currentY = anim.fromY + (anim.toY - anim.fromY) * anim.progress;
            const moverColor = gameState.currentPlayer === 'player1'
              ? gameState.player1Color : gameState.player2Color;
            return (
              <g key={anim.id}>
                <circle cx={currentX} cy={currentY} r={24}
                  fill={moverColor}
                  stroke={moverColor} strokeWidth="2"
                  filter="url(#node-glow)"
                />
                <ellipse cx={currentX-7} cy={currentY-7} rx={7} ry={4}
                  fill="rgba(255,255,255,0.25)"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 22, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={resetGame} style={{
          background: 'linear-gradient(135deg, #ff6b6b, #c0392b)',
          color: 'white', border: 'none',
          padding: '11px 26px', borderRadius: 24,
          fontSize: '0.95em', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,100,100,0.35)',
          transition: 'all 0.2s',
        }}
          onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={e  => (e.currentTarget.style.transform = '')}
        >
          🔄 New Game
        </button>
      </div>

      {/* ── How to play ─────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 30, background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '18px 22px', borderRadius: 16,
        maxWidth: 560, width: '100%',
        backdropFilter: 'blur(8px)', fontSize: '0.87em',
        lineHeight: '1.75', color: 'rgba(255,255,255,0.72)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: '#7eb8ff', fontSize: '0.95em' }}>📖 How to Play</div>
        <div>
          <strong style={{ color: '#f39c12' }}>Phase 1 – Placement:</strong>{' '}
          Each player places their 3 pawns one by one on any empty intersection.<br/>
          <strong style={{ color: '#1e90ff' }}>Phase 2 – Movement:</strong>{' '}
          Select one of your pawns then tap an adjacent connected spot to move it.<br/>
          <strong style={{ color: '#a78bfa' }}>Win:</strong>{' '}
          Align all 3 of your pawns in a row — horizontal, vertical, or diagonal.
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
