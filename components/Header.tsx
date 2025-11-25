
import React from 'react';
import { GameMode } from '../App';

interface HeaderProps {
  gameDuration: number;
  gameMode: GameMode;
}

const Header: React.FC<HeaderProps> = ({ gameDuration, gameMode }) => {
  return (
    <div className="w-full flex justify-between items-end mb-2 px-2 border-b border-white/10 pb-2 landscape:mb-0 landscape:pb-1">
      <div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic tracking-tighter landscape:text-xl">
            HOLE IN ONE
          </h1>
          <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mt-1 landscape:hidden">
            Physics Golf Simulator
          </p>
      </div>
      <div className="text-right">
          <span className="inline-block px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {gameMode === 'practice' ? 'Free Play' : 
             gameMode === 'localMultiplayer' ? 'Local VS' : 
             gameMode === 'onlineMultiplayer' ? 'Online Match' : 'Arcade Mode'}
          </span>
      </div>
    </div>
  );
};

export default Header;
