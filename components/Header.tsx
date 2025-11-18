import React from 'react';
import { GameMode } from '../App';

interface HeaderProps {
  gameDuration: number;
  gameMode: GameMode;
}

const Header: React.FC<HeaderProps> = ({ gameDuration, gameMode }) => {
  return (
    <div className="text-center mb-2 sm:mb-4">
      <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
        Hole in One
      </h1>
      <p className="text-slate-400 mt-2 text-sm sm:text-base">
        {gameMode === 'practice'
          ? "Hone your skills. No timer, no score."
          : `Score as many goals as you can in ${gameDuration} seconds! The timer starts on your first shot.`
        }
      </p>
    </div>
  );
};

export default Header;