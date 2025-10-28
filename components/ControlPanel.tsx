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
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
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


  return (
    <div className="w-full max-w-4xl bg-slate-800/50 p-4 mt-4 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md border border-slate-700">
      <div className="flex items-center space-x-4">
         <button
            onClick={onShowLeaderboard}
            className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold rounded-lg shadow-lg focus:outline-none transition-all duration-300 transform hover:scale-105"
        >
            Leaderboard
        </button>
        {highScore ? (
           <div>
            <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best Score</h2>
            <p className="text-xl font-bold text-white">{highScore.name} - {highScore.score}</p>
          </div>
        ) : (
           <div>
             <h2 className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Best Score</h2>
             <p className="text-xl font-bold text-white">-</p>
           </div>
        )}
      </div>

      <div className="flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
        {isGameOver ? (
           <p className="text-3xl font-bold text-red-500 animate-pulse tracking-widest">TIME'S UP!</p>
        ) : !isGameActive ? (
            <div className="flex items-center space-x-6">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-300 tracking-wide mb-2">Difficulty</h2>
                    <div className={`flex space-x-2 p-1 rounded-lg transition-colors duration-300 ease-in-out ${isAnimatingDifficulty ? 'bg-cyan-500/20' : 'bg-transparent'}`}>
                        <DifficultyButton level="normal" current={difficulty} onClick={onChangeDifficulty}>Normal</DifficultyButton>
                        <DifficultyButton level="advanced" current={difficulty} onClick={onChangeDifficulty}>Advanced</DifficultyButton>
                        <DifficultyButton level="maximum" current={difficulty} onClick={onChangeDifficulty}>Maximum</DifficultyButton>
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-300 tracking-wide mb-2">Time Limit</h2>
                    <div className="flex items-center space-x-2 bg-slate-700 rounded-lg p-1">
                        <button onClick={() => onChangeGameDuration(-30)} disabled={gameDuration <= 30} className="px-2 py-1 text-lg font-bold rounded disabled:opacity-50 text-white hover:bg-slate-600">-</button>
                        <span className="text-lg font-bold text-white w-16 text-center">{gameDuration}s</span>
                        <button onClick={() => onChangeGameDuration(30)} disabled={gameDuration >= 180} className="px-2 py-1 text-lg font-bold rounded disabled:opacity-50 text-white hover:bg-slate-600">+</button>
                    </div>
                </div>
            </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold text-slate-300 tracking-wide text-center">STREAK</h2>
              <span className="text-3xl font-bold text-white bg-slate-700/50 px-4 py-1 rounded-lg min-w-[80px] text-center block">{holeInOneStreak}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-300 tracking-wide text-center">SCORE</h2>
              <span className="text-3xl font-bold text-white bg-slate-700/50 px-4 py-1 rounded-lg min-w-[80px] text-center block">{score}</span>
            </div>
             {isTripleGoalBonusAvailable ? (
                <button
                    onClick={onActivateBonus}
                    className="px-4 py-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 animate-pulse h-full"
                >
                    TRIPLE GOAL!
                </button>
            ) : (
                 <div>
                    <h2 className="text-xl font-semibold text-slate-300 tracking-wide text-center">TIME</h2>
                    <span className="text-3xl font-bold text-white bg-slate-700/50 px-4 py-1 rounded-lg min-w-[80px] text-center block">{timeLeft}</span>
                </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={onReset}
        className="px-6 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
      >
        {isGameActive || isGameOver ? 'New Game' : 'Start'}
      </button>
    </div>
  );
};

export default ControlPanel;