import React, { useState, useEffect, useRef } from 'react';
import { HighScore } from '../types';
import { Difficulty, GameMode } from '../App';

interface ControlPanelProps {
  score: number;
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
            className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-cyan-500 text-white shadow-lg cursor-default' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
            {children}
        </button>
    )
}

const GameOverMessage: React.FC<{ 
    gameMode: GameMode, 
    localPlayerScores: {p1: number, p2: number},
    onlineWinner: 1 | 2 | 'tie' | null,
 }> = ({ gameMode, localPlayerScores, onlineWinner}) => {
    let message = "TIME'S UP!";

    if (gameMode === 'singleplayer') {
        return <p className="text-2xl sm:text-3xl font-bold text-red-500 animate-pulse tracking-widest">{message}</p>
    }

    if (gameMode === 'localMultiplayer') {
        if (localPlayerScores.p1 > localPlayerScores.p2) {
            message = "PLAYER 1 WINS!";
        } else if (localPlayerScores.p2 > localPlayerScores.p1) {
            message = "PLAYER 2 WINS!";
        } else {
            message = "IT'S A TIE!";
        }
    }

    if (gameMode === 'onlineMultiplayer') {
        if (onlineWinner === 1) {
            message = "PLAYER 1 WINS!";
        } else if (onlineWinner === 2) {
            message = "PLAYER 2 WINS!";
        } else if (onlineWinner === 'tie') {
            message = "IT'S A TIE!";
        } else {
            message = "GAME OVER!"; // Default/disconnect case
        }
    }

    return <p className="text-2xl sm:text-3xl font-bold text-red-500 animate-pulse tracking-widest">{message}</p>
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  score, 
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

  const showDifficultySelector = gameMode === 'practice' || (!isGameActive && gameMode !== 'onlineMultiplayer');

  return (
    <div className="w-full max-w-4xl bg-slate-800/50 p-2 sm:p-4 mt-2 sm:mt-4 rounded-xl flex flex-col md:flex-row items-center justify-between shadow-2xl backdrop-blur-md border border-slate-700 gap-4">
      <div className="hidden md:flex items-center space-x-4 order-1">
         <button
            onClick={onShowLeaderboard}
            className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold rounded-lg shadow-lg focus:outline-none transition-all duration-300 transform hover:scale-105"
        >
            Leaderboard
        </button>
        {gameMode === 'singleplayer' && (highScore ? (
           <div>
            <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best Score</h2>
            <p className="text-xl font-bold text-white">{highScore.name} - {highScore.score}</p>
          </div>
        ) : (
           <div>
             <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best Score</h2>
             <p className="text-xl font-bold text-white">-</p>
           </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6 order-1 md:order-2">
        {isGameOver ? (
           <GameOverMessage gameMode={gameMode} localPlayerScores={playerScores} onlineWinner={onlineWinner} />
        ) : showDifficultySelector ? (
            <div className="flex items-center space-x-6">
                <div className="text-center">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-300 tracking-wide mb-2">Difficulty</h2>
                    <div className={`flex space-x-2 p-1 rounded-lg`}>
                        <DifficultyButton level="normal" current={difficulty} onClick={onChangeDifficulty}>Normal</DifficultyButton>
                        <DifficultyButton level="advanced" current={difficulty} onClick={onChangeDifficulty}>Advanced</DifficultyButton>
                        <DifficultyButton level="maximum" current={difficulty} onClick={onChangeDifficulty}>Maximum</DifficultyButton>
                    </div>
                </div>
            </div>
        ) : gameMode === 'singleplayer' ? (
          <>
            <div className="text-center">
              <h2 className="text-sm sm:text-xl font-semibold text-slate-300 tracking-wide">STREAK</h2>
              <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{holeInOneStreak}</span>
            </div>
            <div className="text-center">
              <h2 className="text-sm sm:text-xl font-semibold text-slate-300 tracking-wide">SCORE</h2>
              <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{score}</span>
            </div>
            <div className="text-center">
                <h2 className="text-sm sm:text-xl font-semibold text-slate-300 tracking-wide">TIME</h2>
                <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{timeLeft}</span>
            </div>
          </>
        ) : gameMode === 'localMultiplayer' ? ( 
             <>
                <div className="p-2 rounded-lg">
                    <h2 className="text-base sm:text-xl font-semibold tracking-wide text-center text-cyan-400">P1</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{displayScores.p1}</span>
                </div>
                <div className="text-center">
                    <h2 className="text-base sm:text-xl font-semibold text-slate-300 tracking-wide">TIME</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{timeLeft}</span>
                </div>
                <div className="p-2 rounded-lg">
                     <h2 className="text-base sm:text-xl font-semibold tracking-wide text-center text-red-400">P2</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{displayScores.p2}</span>
                </div>
             </>
        ) : ( // Online Multiplayer
             <>
                <div className={`p-2 rounded-lg transition-all duration-300 ${onlineCurrentPlayer === 1 ? 'bg-cyan-500/20' : ''}`}>
                    <h2 className={`text-base sm:text-xl font-semibold tracking-wide text-center ${onlineCurrentPlayer === 1 ? 'text-cyan-400' : 'text-slate-300'}`}>P1</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{displayScores.p1}</span>
                </div>
                <div className="text-center">
                    <h2 className="text-base sm:text-xl font-semibold text-slate-300 tracking-wide">TIME</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{timeLeft}</span>
                </div>
                <div className={`p-2 rounded-lg transition-all duration-300 ${onlineCurrentPlayer === 2 ? 'bg-red-500/20' : ''}`}>
                     <h2 className={`text-base sm:text-xl font-semibold tracking-wide text-center ${onlineCurrentPlayer === 2 ? 'text-red-400' : 'text-slate-300'}`}>P2</h2>
                    <span className="text-2xl sm:text-3xl font-bold text-white bg-slate-700/50 px-3 sm:px-4 py-1 rounded-lg min-w-[60px] sm:min-w-[80px] text-center block">{displayScores.p2}</span>
                </div>
             </>
        )}
      </div>

        <div className="flex flex-row md:flex-col items-stretch space-x-2 md:space-x-0 md:space-y-2 order-2 md:order-3">
            {gameMode !== 'onlineMultiplayer' && (
                <button
                    onClick={onReset}
                    className="px-6 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
                >
                    {gameMode === 'practice' ? 'Reset' : (isGameActive || isGameOver ? 'New Game' : 'Start')}
                </button>
            )}
            <button
                onClick={onReturnToMenu}
                className="px-6 py-1 bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-600 transition-all duration-300"
            >
                Menu
            </button>
        </div>
    </div>
  );
};

export default ControlPanel;