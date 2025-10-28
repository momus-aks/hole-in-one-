import React, { useState, useEffect } from 'react';
import { HighScore } from '../types';

interface HighScoreModalProps {
  isOpen: boolean;
  score: number;
  onSave: (name: string) => void;
  leaderboard: HighScore[];
}

const HighScoreModal: React.FC<HighScoreModalProps> = ({ isOpen, score, onSave, leaderboard }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(''); // Reset name when modal opens
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm text-center">
        <h2 className="text-3xl font-bold text-cyan-400 mb-2">You Made the Leaderboard!</h2>
        <p className="text-slate-300 mb-4">You set a new record with <span className="font-bold text-white text-lg">{score}</span> goals!</p>
        <p className="text-slate-400 mb-6">Enter your name to save your score:</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={12}
            className="w-full px-4 py-2 bg-slate-900 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            disabled={!name.trim()}
          >
            Save Score
          </button>
        </form>
      </div>
    </div>
  );
};

export default HighScoreModal;