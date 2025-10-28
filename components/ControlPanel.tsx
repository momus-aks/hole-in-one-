import React, { useState, useEffect, useRef } from 'react';
import { HighScore } from '../types';
import { Difficulty } from '../App';

interface ControlPanelProps {
  score: number;
  timeLeft: number;
  isGameActive: boolean;
  isGameOver: boolean;
  onReset: () => void;
  highScore: HighScore | null;
  holeInOneStreak: number;
  isTripleGoalBonusAvailable: boolean;
  onActivateBonus: () => void;
  difficulty: Difficulty;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  gameDuration: number;
  onChangeGameDuration: (increment: number) => void;
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
            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 flex-grow ${
                isActive 
                ? 'bg-cyan-500 text-white shadow-lg' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
            {children}
        </button>
    )
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  score, 
  timeLeft,
  isGameActive,
  isGameOver,
  onReset,
  highScore,
  holeInOneStreak,
  isTripleGoalBonusAvailable,
  onActivateBonus,
  difficulty,
  onChangeDifficulty,
  onShowLeaderboard,
  gameDuration,
  onChangeGameDuration
}) => {
  const [isAnimatingDifficulty, setIsAnimatingDifficulty] = useState(false);
  const prevDifficultyRef = useRef(difficulty);

  useEffect(() => {
    if (prevDifficultyRef.current !== difficulty) {
      setIsAnimatingDifficulty(true);
      const timer = setTimeout(() => {
        setIsAnimatingDifficulty(false);
      }, 400); // Animation duration
      
      prevDifficultyRef.current = difficulty;
      return () => clearTimeout(timer);
    }
  }, [difficulty]);

  const renderPreGameControls = () => (
    <div className="w-full max-w-4xl bg-slate-800/50 p-3 md:p-4 rounded-xl shadow-2xl backdrop-blur-md border border-slate-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Section */}
        <div className="w-full md:w-auto flex flex-row items-center justify-between md:justify-start md:space-x-4">
          <button
            onClick={onShowLeaderboard}
            className="px-3 py-2 md:px-4 bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
          >
            Leaderboard
          </button>
          {highScore ? (
            <div className="text-right md:text-left">
              <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best</h2>
              <p className="text-base md:text-xl font-bold text-white">{highScore.score}</p>
            </div>
          ) : (
            <div className="text-right md:text-left">
              <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best</h2>
              <p className="text-base md:text-xl font-bold text-white">-</p>
            </div>
          )}
        </div>

        {/* Middle Section */}
        <div className="order-first md:order-none w-full md:w-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full">
            <div className="text-center w-full lg:w-auto">
              <h2 className="text-sm md:text-lg font-semibold text-slate-300 tracking-wide mb-2">Difficulty</h2>
              <div className={`flex space-x-2 p-1 rounded-lg transition-colors duration-300 ease-in-out ${isAnimatingDifficulty ? 'bg-cyan-500/20' : 'bg-transparent'}`}>
                <DifficultyButton level="normal" current={difficulty} onClick={onChangeDifficulty}>Normal</DifficultyButton>
                <DifficultyButton level="advanced" current={difficulty} onClick={onChangeDifficulty}>Advanced</DifficultyButton>
                <DifficultyButton level="maximum" current={difficulty} onClick={onChangeDifficulty}>Maximum</DifficultyButton>
              </div>
            </div>
            <div className="text-center w-full lg:w-auto">
              <h2 className="text-sm md:text-lg font-semibold text-slate-300 tracking-wide mb-2">Time Limit</h2>
              <div className="flex items-center justify-center space-x-2 bg-slate-700 rounded-lg p-1">
                <button onClick={() => onChangeGameDuration(-30)} disabled={gameDuration <= 30} className="px-2 py-1 text-lg font-bold rounded disabled:opacity-50 text-white hover:bg-slate-600">-</button>
                <span className="text-base md:text-lg font-bold text-white w-16 text-center">{gameDuration}s</span>
                <button onClick={() => onChangeGameDuration(30)} disabled={gameDuration >= 180} className="px-2 py-1 text-lg font-bold rounded disabled:opacity-50 text-white hover:bg-slate-600">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-auto">
          <button
            onClick={onReset}
            className="w-full md:w-auto px-6 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );

  const renderInGameStats = () => (
    <div className="w-full bg-slate-800 p-2 shadow-lg z-10 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-around gap-2">
        <div className="text-center">
          <h2 className="text-xs md:text-base font-semibold text-slate-300 tracking-wide">STREAK</h2>
          <span className="text-lg md:text-2xl font-bold text-white min-w-[60px] text-center block">{holeInOneStreak}</span>
        </div>
        <div className="text-center">
          <h2 className="text-xs md:text-base font-semibold text-slate-300 tracking-wide">SCORE</h2>
          <span className="text-lg md:text-2xl font-bold text-white min-w-[60px] text-center block">{score}</span>
        </div>
        {isTripleGoalBonusAvailable ? (
          <button
            onClick={onActivateBonus}
            className="px-3 py-2 md:px-4 text-sm md:text-base bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse"
          >
            TRIPLE GOAL!
          </button>
        ) : (
          <div className="text-center">
            <h2 className="text-xs md:text-base font-semibold text-slate-300 tracking-wide">TIME</h2>
            <span className="text-lg md:text-2xl font-bold text-white min-w-[60px] text-center block">{timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <p className="text-4xl md:text-5xl font-bold text-red-500 animate-pulse tracking-widest">TIME'S UP!</p>
        <p className="text-xl mt-2">Final Score: <span className="font-bold text-white text-2xl">{score}</span></p>
        <button
            onClick={onReset}
            className="mt-6 px-8 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
        >
            New Game
        </button>
    </div>
  );

  if (isGameOver) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            {renderGameOver()}
        </div>
    );
  }

  if (isGameActive) {
    return renderInGameStats();
  }

  return renderPreGameControls();
};

export default ControlPanel;