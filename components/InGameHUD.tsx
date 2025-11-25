
import React from 'react';
import { GameMode } from '../App';

interface InGameHUDProps {
  gameMode: GameMode;
  score: number;
  playerScores: { p1: number; p2: number };
  onlinePlayerScores: { p1: number; p2: number };
  timeLeft: number;
  onPause: () => void;
}

const InGameHUD: React.FC<InGameHUDProps> = ({ 
    gameMode, 
    score, 
    playerScores, 
    onlinePlayerScores, 
    timeLeft, 
    onPause 
}) => {
  const isMultiplayer = gameMode === 'localMultiplayer' || gameMode === 'onlineMultiplayer';
  const displayScores = gameMode === 'onlineMultiplayer' ? onlinePlayerScores : playerScores;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        
        {/* Score Section */}
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg flex flex-col gap-1 min-w-[100px]">
            {isMultiplayer ? (
                <>
                    <div className="flex justify-between items-center text-cyan-400 font-bold">
                        <span className="text-xs uppercase tracking-wider">P1</span>
                        <span className="text-xl">{displayScores.p1}</span>
                    </div>
                    <div className="w-full h-px bg-white/10"></div>
                    <div className="flex justify-between items-center text-red-500 font-bold">
                        <span className="text-xs uppercase tracking-wider">P2</span>
                        <span className="text-xl">{displayScores.p2}</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">Score</span>
                    <span className="text-3xl font-black text-cyan-400 leading-none">{score}</span>
                </div>
            )}
        </div>

        {/* Timer Section */}
        <div className={`pointer-events-auto bg-slate-900/60 backdrop-blur-md border ${timeLeft < 10 ? 'border-red-500/50 shadow-red-900/20' : 'border-white/10'} rounded-xl px-6 py-2 shadow-lg flex flex-col items-center`}>
            <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold mb-1">Time</span>
            <span className={`text-3xl font-black font-mono leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timeLeft}
            </span>
        </div>

        {/* Pause Button */}
        <button 
            onClick={onPause}
            className="pointer-events-auto bg-slate-900/60 backdrop-blur-md border border-white/10 hover:bg-slate-800 rounded-xl p-3 shadow-lg group transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-300 group-hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
        </button>
      </div>

      {/* Bottom Area (Optional: Could act as a safe zone or instructions) */}
      <div className="w-full text-center pointer-events-none opacity-50">
          {gameMode === 'localMultiplayer' && (
              <p className="text-[10px] text-white uppercase tracking-widest font-bold shadow-black drop-shadow-md">
                  P1: Mouse • P2: Spacebar
              </p>
          )}
      </div>
    </div>
  );
};

export default InGameHUD;
