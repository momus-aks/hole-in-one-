
import React, { useState, useEffect, useRef } from 'react';
import { HighScore } from '../types';
import { Difficulty, GameMode } from '../App';

interface ControlPanelProps {
  score: number;
  totalShots: number;
  timeLeft: number;
  isGameActive: boolean;
  isGameOver: boolean;
  onReset: () => void;
  highScore: HighScore | null;
  holeInOneStreak: number;
  difficulty: Difficulty;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  gameDuration: number;
  gameMode: GameMode;
  onReturnToMenu: () => void;
  // Local MP
  playerScores: { p1: number, p2: number };
  // Online MP
  onlinePlayerScores: { p1: number, p2: number };
  onlineCurrentPlayer: 1 | 2;
  onlineWinner: 1 | 2 | 'tie' | null;
}

const DifficultyButton: React.FC<{
    level: Difficulty;
    current: Difficulty;
    onClick: (level: Difficulty) => void;
    children: React.ReactNode;
}> = ({ level, current, onClick, children }) => {
    const isActive = level === current;
    return (
        <button
            onClick={() => onClick(level)}
            disabled={isActive}
            className={`px-3 py-1 sm:py-2 text-xs sm:text-xs font-bold rounded-md transition-all duration-200 uppercase tracking-wider ${
                isActive 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 cursor-default' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
            }`}
        >
            {children}
        </button>
    )
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; color?: string }> = ({ title, value, icon, color = "text-white" }) => (
    <div className="bg-slate-800/60 border border-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 landscape:p-1 flex flex-col items-center justify-center shadow-lg min-w-[80px]">
        <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{title}</h3>
        <div className={`text-xl sm:text-2xl landscape:text-lg font-black ${color} flex items-center gap-1`}>
            {icon}
            {value}
        </div>
    </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  score, 
  totalShots,
  timeLeft,
  isGameActive,
  isGameOver,
  onReset,
  highScore,
  holeInOneStreak,
  difficulty,
  onChangeDifficulty,
  onShowLeaderboard,
  gameDuration,
  gameMode,
  onReturnToMenu,
  playerScores,
  onlinePlayerScores,
  onlineCurrentPlayer,
  onlineWinner,
}) => {
  const isMultiplayer = gameMode === 'localMultiplayer' || gameMode === 'onlineMultiplayer';
  const displayScores = isMultiplayer ? (gameMode === 'onlineMultiplayer' ? onlinePlayerScores : playerScores) : { p1: 0, p2: 0 };

  // Calculate Accuracy
  const accuracy = totalShots > 0 ? Math.round((score / totalShots) * 100) : 0;

  // Determine Winner Text
  let endMessage = "GAME OVER";
  let endColor = "text-slate-200";
  if (isGameOver) {
      if (gameMode === 'singleplayer') {
          endMessage = "TIME'S UP";
          endColor = "text-cyan-400";
      } else if (isMultiplayer) {
          let winner = 0;
          if (gameMode === 'localMultiplayer') {
              if (displayScores.p1 > displayScores.p2) winner = 1;
              else if (displayScores.p2 > displayScores.p1) winner = 2;
          } else {
              if (onlineWinner === 1) winner = 1;
              else if (onlineWinner === 2) winner = 2;
          }
          
          if (winner === 1) { endMessage = "PLAYER 1 WINS"; endColor = "text-cyan-400"; }
          else if (winner === 2) { endMessage = "PLAYER 2 WINS"; endColor = "text-red-500"; }
          else { endMessage = "DRAW GAME"; endColor = "text-amber-400"; }
      }
  }

  return (
    <div className="w-full max-w-5xl mt-2 sm:mt-4 landscape:mt-1 flex flex-col gap-4 landscape:gap-1">
        
        {/* Top Row: Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 landscape:grid-cols-4 gap-2 sm:gap-4 landscape:gap-2">
            
            {/* Card 1: Primary Stat (Score or P1) */}
            {isMultiplayer ? (
                 <StatCard 
                    title="Player 1" 
                    value={displayScores.p1} 
                    color="text-cyan-400"
                    icon={<div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] mr-2" />}
                 />
            ) : (
                 <StatCard 
                    title="Score" 
                    value={score} 
                    color="text-cyan-400" 
                 />
            )}

            {/* Card 2: Secondary Stat (Time or P2) */}
            {isMultiplayer ? (
                <StatCard 
                    title="Player 2" 
                    value={displayScores.p2} 
                    color="text-red-500"
                    icon={<div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] mr-2" />}
                />
            ) : (
                <StatCard 
                    title="Accuracy" 
                    value={`${accuracy}%`} 
                    color={accuracy > 80 ? "text-emerald-400" : accuracy > 50 ? "text-amber-400" : "text-slate-200"} 
                />
            )}

            {/* Card 3: Timer/Status */}
            <div className={`bg-slate-800/60 border ${timeLeft < 10 && !isGameOver ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'} backdrop-blur-md rounded-lg p-2 sm:p-3 landscape:p-1 flex flex-col items-center justify-center shadow-lg`}>
                <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Time Remaining</h3>
                {isGameOver ? (
                    <span className={`text-lg font-bold uppercase tracking-tight ${endColor} animate-pulse`}>{endMessage}</span>
                ) : (
                    <div className="flex items-end gap-1">
                        <span className="text-2xl landscape:text-lg font-black text-white font-mono">{timeLeft}</span>
                        <span className="text-xs font-bold text-slate-500 mb-1">sec</span>
                    </div>
                )}
            </div>

            {/* Card 4: Meta Stats (Streak or Difficulty) */}
            {gameMode === 'singleplayer' ? (
                 <StatCard 
                 title="Hot Streak" 
                 value={holeInOneStreak} 
                 color={holeInOneStreak > 0 ? "text-amber-400" : "text-slate-500"}
                 icon={holeInOneStreak > 0 ? <span className="text-lg">🔥</span> : null}
              />
            ) : (
                <div className="bg-slate-800/60 border border-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 landscape:p-1 flex flex-col items-center justify-center shadow-lg">
                     <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Game Mode</h3>
                     <span className="text-sm font-bold text-white uppercase tracking-wider">
                         {gameMode === 'localMultiplayer' ? 'Local VS' : 'Online VS'}
                     </span>
                </div>
            )}
        </div>

        {/* Bottom Row: Controls & Settings */}
        <div className="flex flex-col md:flex-row landscape:flex-row items-center justify-between gap-4 landscape:gap-2 bg-slate-900/50 p-3 landscape:p-1 rounded-xl border border-white/5">
            
            {/* Left: Game Settings */}
            <div className="flex items-center gap-4 order-2 md:order-1 landscape:order-1">
                 {!isGameActive && gameMode !== 'onlineMultiplayer' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Level:</span>
                        <div className="flex gap-1">
                            <DifficultyButton level="normal" current={difficulty} onClick={onChangeDifficulty}>Norm</DifficultyButton>
                            <DifficultyButton level="advanced" current={difficulty} onClick={onChangeDifficulty}>Adv</DifficultyButton>
                            <DifficultyButton level="maximum" current={difficulty} onClick={onChangeDifficulty}>Max</DifficultyButton>
                        </div>
                    </div>
                 )}
                 {gameMode === 'singleplayer' && (
                     <div className="hidden sm:block text-xs text-slate-500">
                        High Score: <span className="text-white font-bold ml-1">{highScore ? highScore.score : 0}</span>
                     </div>
                 )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end order-1 md:order-2 landscape:order-2">
                <button
                    onClick={onShowLeaderboard}
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                >
                    Leaderboard
                </button>
                
                {gameMode !== 'onlineMultiplayer' && (
                    <button
                        onClick={onReset}
                        className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-lg shadow-cyan-900/50 transition-transform active:scale-95"
                    >
                        {gameMode === 'practice' ? 'Reset Board' : (isGameOver ? 'Play Again' : 'Restart')}
                    </button>
                )}

                <button
                    onClick={onReturnToMenu}
                    className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/30 transition-colors"
                >
                    Exit
                </button>
            </div>
        </div>
    </div>
  );
};

export default ControlPanel;
