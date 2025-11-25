
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import GameCanvas from './components/GameCanvas';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import HighScoreModal from './components/HighScoreModal';
import LeaderboardModal from './components/LeaderboardModal';
import MainMenu from './components/MainMenu';
import WaitingRoom from './components/WaitingRoom';
import InGameHUD from './components/InGameHUD';
import { HighScore, GameState, Vector2D, Player } from './types';

export type Difficulty = 'normal' | 'advanced' | 'maximum';
export type GameMode = 'menu' | 'singleplayer' | 'findingMatch' | 'onlineMultiplayer' | 'localMultiplayer' | 'practice';

const INITIAL_GAME_DURATION = 60; // seconds
const HOLE_IN_ONE_BONUS = 5; // seconds
const STREAK_FOR_BONUS = 3;

// Use 10.0.2.2 for Android Emulator to connect to the host machine's localhost
const SERVER_URL = 'http://10.0.2.2:8080';

const App: React.FC = () => {
  // Single player state
  const [score, setScore] = useState<number>(0);
  const [totalShots, setTotalShots] = useState<number>(0);
  const [holeInOneStreak, setHoleInOneStreak] = useState<number>(0);
  const [isTripleGoalBonusAvailable, setIsTripleGoalBonusAvailable] = useState<boolean>(false);
  const [isTripleGoalBonusActive, setIsTripleGoalBonusActive] = useState<boolean>(false);

  // Shared game state
  const [gameDuration, setGameDuration] = useState<number>(INITIAL_GAME_DURATION);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_GAME_DURATION);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  
  // Game mode state
  const [gameMode, setGameMode] = useState<GameMode>('menu');

  // Local Multiplayer state
  const [localPlayerScores, setLocalPlayerScores] = useState({ p1: 0, p2: 0 });

  // Online Multiplayer State
  const socketRef = useRef<Socket | null>(null);
  const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const playerNumberRef = useRef(playerNumber);
  const [onlineWinner, setOnlineWinner] = useState<1 | 2 | 'tie' | null>(null);


  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<HighScore[]>([]);
  const [isHighScoreModalOpen, setIsHighScoreModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedLeaderboard = localStorage.getItem('holeInOneLeaderboard');
      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      }
    } catch (error) {
      console.error("Failed to load leaderboard from localStorage", error);
    }
  }, []);

  // Timer Effect for Single Player and Local Multiplayer
  useEffect(() => {
    if (gameMode !== 'singleplayer' && gameMode !== 'localMultiplayer') return;
    if (!isGameActive || isGameOver) return;

    if (timeLeft <= 0) {
      setIsGameActive(false);
      setIsGameOver(true);
      if (gameMode === 'singleplayer') {
        const isNewHighScore = score > 0 && (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score);
        if (isNewHighScore) {
          setIsHighScoreModalOpen(true);
        }
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isGameActive, timeLeft, isGameOver, score, leaderboard, gameMode]);
  
  useEffect(() => {
    playerNumberRef.current = playerNumber;
  }, [playerNumber]);

  // Socket.IO Connection and Event Handlers
  useEffect(() => {
    // Connect if we are entering an online mode and there's no active connection.
    if ((gameMode === 'findingMatch' || gameMode === 'onlineMultiplayer') && !socketRef.current) {
        const socket = io(SERVER_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to server!');
        });

        socket.on('waitingForOpponent', () => {
            console.log('Waiting for an opponent...');
            setGameMode('findingMatch');
        });

        socket.on('gameStart', (data: GameState & { yourPlayerNumber: 1 | 2 }) => {
            console.log('Game starting!', data);
            setOnlineGameState(data);
            setPlayerNumber(data.yourPlayerNumber);
            setGameMode('onlineMultiplayer');
            setIsGameOver(false);
            setOnlineWinner(null);
        });
        
        socket.on('gameStateUpdate', (stateUpdate: Partial<GameState>) => {
            setOnlineGameState(prevState => prevState ? { ...prevState, ...stateUpdate } : null);
        });

        socket.on('goalScored', (data: { scoringPlayerNumber: 1 | 2, newScores: { p1: number, p2: number }, newHolePosition: Vector2D }) => {
            setOnlineGameState(prevState => {
                if (!prevState) return null;
                // Safely update nested player scores to avoid mutation
                const newPlayers: [Player, Player] = [
                    { ...prevState.players[0], score: data.newScores.p1 },
                    { ...prevState.players[1], score: data.newScores.p2 },
                ];
                return {
                    ...prevState,
                    players: newPlayers,
                    holePosition: data.newHolePosition,
                };
            });
        });

        socket.on('gameOver', (data: { winner: 1 | 2 | 'tie', finalScores: { p1: number, p2: number } }) => {
            console.log('Game Over!', data);
            setIsGameOver(true);
            setOnlineWinner(data.winner);
        });
        
        socket.on('opponentDisconnect', () => {
            console.log('Opponent disconnected');
            setIsGameOver(true);
            setOnlineWinner(playerNumberRef.current); // You win by default
        });
    } 
    // Disconnect if we are NOT in an online mode but a connection exists.
    else if (gameMode !== 'findingMatch' && gameMode !== 'onlineMultiplayer' && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

  }, [gameMode]);

  // Effect to handle cleanup on component unmount
  useEffect(() => {
    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };
  }, []);


  const handleBallInHole = useCallback((data: { shotCount: number, scoringPlayer?: 1 | 2 }) => {
      if (gameMode === 'singleplayer') {
        setScore(prev => prev + 1);
        if (data.shotCount === 1) { // Hole in one
          setTimeLeft(prev => prev + HOLE_IN_ONE_BONUS);
          setHoleInOneStreak(prev => prev + 1);
        } else {
          setHoleInOneStreak(0);
        }
      } else if (gameMode === 'localMultiplayer') {
         if (data.scoringPlayer) {
            setLocalPlayerScores(prevScores => {
                return data.scoringPlayer === 1 
                ? { ...prevScores, p1: prevScores.p1 + 1 }
                : { ...prevScores, p2: prevScores.p2 + 1 };
            });
        }
      }
  }, [gameMode]);
  
  const handleBallStop = useCallback(() => {
    // No longer used for switching turns in local multiplayer
  }, []);
  
  const handleShot = useCallback(() => {
    // Increment total shots for stats
    if (gameMode === 'singleplayer' || gameMode === 'practice') {
        setTotalShots(prev => prev + 1);
    }

    if (!isGameActive && !isGameOver && (gameMode === 'singleplayer' || gameMode === 'localMultiplayer' || gameMode === 'practice')) {
      setIsGameActive(true);
    }
  }, [isGameActive, isGameOver, gameMode]);

  const handleOnlineShot = useCallback((velocity: Vector2D) => {
    socketRef.current?.emit('playerShoot', { velocity });
  }, []);

  const handleReset = useCallback(() => {
    setTimeLeft(gameDuration);
    setIsGameActive(false);
    setIsGameOver(false);
    setResetKey(prev => prev + 1);

    if (gameMode === 'singleplayer') {
      setScore(0);
      setHoleInOneStreak(0);
      setTotalShots(0);
    } else if (gameMode === 'localMultiplayer') {
      setLocalPlayerScores({ p1: 0, p2: 0 });
    }
  }, [gameDuration, gameMode]);
  
  const handlePause = useCallback(() => {
    setIsGameActive(false);
  }, []);

  const startGame = useCallback((mode: Exclude<GameMode, 'menu' | 'findingMatch'>) => {
    setGameMode(mode);
    if (mode === 'onlineMultiplayer') {
      setGameMode('findingMatch');
      socketRef.current?.emit('findMatch');
    } else {
      setTimeout(() => handleReset(), 0);
    }
  }, [handleReset]);

  const handleReturnToMenu = () => {
    setGameMode('menu');
    setIsGameActive(false);
    setIsGameOver(false);
    setOnlineGameState(null);
    setPlayerNumber(null);
  };

  const handleSaveHighScore = (name: string) => {
    const newScore = { name, score, difficulty };
    const newLeaderboard = [...leaderboard, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    try {
        localStorage.setItem('holeInOneLeaderboard', JSON.stringify(newLeaderboard));
        setLeaderboard(newLeaderboard);
    } catch (error) {
        console.error("Failed to save leaderboard to localStorage", error);
    }
    setIsHighScoreModalOpen(false);
  };

  const handleChangeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    handleReset();
  };

  if (gameMode === 'menu') {
    return (
      <div className="h-full w-full bg-[#0f172a] text-white flex flex-col items-center justify-center font-sans p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
        <MainMenu onStartGame={startGame} />
      </div>
    );
  }

  if (gameMode === 'findingMatch') {
      return (
         <div className="h-full w-full bg-[#0f172a] text-white flex flex-col items-center justify-center font-sans p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
            <WaitingRoom onCancel={handleReturnToMenu} />
         </div>
      );
  }

  // Determine which UI elements to show
  // We show the full UI (Header + Control Panel) if the game is NOT active OR if the game is Over.
  // We show the HUD only if the game IS active and NOT over.
  const showFullUI = !isGameActive || isGameOver;
  const showHUD = isGameActive && !isGameOver;

  return (
    <div className="h-full w-full bg-[#0f172a] text-white flex flex-col items-center justify-center font-sans p-2 sm:p-4 landscape:p-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="w-full h-full max-w-5xl mx-auto flex flex-col items-center relative">
        
        {showFullUI && (
             <Header gameDuration={gameDuration} gameMode={gameMode} />
        )}
        
        {/* Game Canvas Container */}
        <div className="relative w-full flex-grow flex flex-col justify-center min-h-0">
             <GameCanvas
                key={resetKey}
                onBallInHole={handleBallInHole}
                onShot={gameMode === 'onlineMultiplayer' ? handleOnlineShot : handleShot}
                isGameOver={isGameOver}
                difficulty={difficulty}
                onBallStop={handleBallStop}
                // Online MP props
                gameMode={gameMode}
                onlineGameState={onlineGameState}
                playerNumber={playerNumber}
            />
            
            {showHUD && (
                <InGameHUD 
                    gameMode={gameMode}
                    score={score}
                    playerScores={localPlayerScores}
                    onlinePlayerScores={onlineGameState ? {p1: onlineGameState.players[0].score, p2: onlineGameState.players[1].score } : {p1: 0, p2: 0}}
                    timeLeft={gameMode === 'onlineMultiplayer' ? (onlineGameState?.timeLeft ?? 0) : timeLeft}
                    onPause={handlePause}
                />
            )}
        </div>

        {showFullUI && (
            <ControlPanel
                score={score}
                totalShots={totalShots}
                timeLeft={gameMode === 'onlineMultiplayer' ? (onlineGameState?.timeLeft ?? 0) : timeLeft}
                isGameActive={gameMode === 'onlineMultiplayer' ? onlineGameState?.status === 'active' : isGameActive}
                isGameOver={isGameOver}
                onReset={handleReset}
                highScore={leaderboard.length > 0 ? leaderboard[0] : null}
                holeInOneStreak={holeInOneStreak}
                difficulty={difficulty}
                onChangeDifficulty={handleChangeDifficulty}
                onShowLeaderboard={() => setIsLeaderboardModalOpen(true)}
                gameDuration={gameDuration}
                gameMode={gameMode}
                onReturnToMenu={handleReturnToMenu}
                // Local MP Props
                playerScores={localPlayerScores}
                // Online MP Props
                onlinePlayerScores={onlineGameState ? {p1: onlineGameState.players[0].score, p2: onlineGameState.players[1].score } : {p1: 0, p2: 0}}
                onlineCurrentPlayer={playerNumber ?? 1} 
                onlineWinner={onlineWinner}
            />
        )}

        <HighScoreModal
          isOpen={isHighScoreModalOpen}
          score={score}
          onSave={handleSaveHighScore}
          leaderboard={leaderboard}
        />
        <LeaderboardModal
          isOpen={isLeaderboardModalOpen}
          leaderboard={leaderboard}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;
