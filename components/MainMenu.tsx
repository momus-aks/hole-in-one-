import React from 'react';

interface MainMenuProps {
  onStartGame: (mode: 'singleplayer' | 'localMultiplayer' | 'onlineMultiplayer' | 'practice') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow">
      <div className="text-center mb-12">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-cyan-400 tracking-wider">
          Hole in One
        </h1>
        <p className="text-slate-400 mt-4 text-base sm:text-lg">
          A physics-based putt-putt game.
        </p>
      </div>
      <div className="flex flex-col space-y-6 w-full max-w-xs">
        <button
          onClick={() => onStartGame('singleplayer')}
          className="w-full px-6 py-4 text-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Single Player
        </button>
        <button
          onClick={() => onStartGame('localMultiplayer')}
          className="w-full px-6 py-4 text-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Multiplayer (Local)
        </button>
         <button
          onClick={() => onStartGame('onlineMultiplayer')}
          className="w-full px-6 py-4 text-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Multiplayer (Online)
        </button>
        <button
          onClick={() => onStartGame('practice')}
          className="w-full px-6 py-4 text-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Practice Mode
        </button>
      </div>
    </div>
  );
};

export default MainMenu;