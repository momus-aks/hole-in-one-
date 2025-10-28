import React from 'react';
import { HighScore } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: HighScore[];
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, leaderboard }) => {
  if (!isOpen) {
    return null;
  }

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced':
        return 'bg-amber-500/20 text-amber-300';
      case 'maximum':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-cyan-500/20 text-cyan-300';
    }
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-50" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg text-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-cyan-400 mb-6">Leaderboard</h2>
        
        {leaderboard.length > 0 ? (
          <ol className="space-y-3">
            {leaderboard.map((entry, index) => (
              <li key={index} className="flex justify-between items-center text-lg p-3 bg-slate-700/50 rounded-lg">
                <span className="font-bold text-slate-300 w-8">#{index + 1}</span>
                <span className="font-semibold text-white flex-1 text-left ml-4">{entry.name}</span>
                <div className="flex items-center space-x-4">
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-md ${getDifficultyClass(entry.difficulty)}`}>
                        {entry.difficulty}
                    </span>
                    <span className="font-bold text-cyan-400 w-24 text-right">{entry.score} Goals</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-400">No scores yet. Be the first!</p>
        )}
        
        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LeaderboardModal;