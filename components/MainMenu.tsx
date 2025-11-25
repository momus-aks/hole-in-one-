
import React from 'react';

interface MainMenuProps {
  onStartGame: (mode: 'singleplayer' | 'localMultiplayer' | 'onlineMultiplayer' | 'practice') => void;
}

const MenuCard: React.FC<{ 
    title: string; 
    desc: string; 
    color: string; 
    onClick: () => void 
}> = ({ title, desc, color, onClick }) => (
    <button
        onClick={onClick}
        className="group relative w-full p-6 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 text-left overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10"
    >
        <div className={`absolute top-0 left-0 w-1 h-full ${color} transition-all duration-300 group-hover:w-2`} />
        <h3 className="text-xl font-bold text-white mb-1 tracking-wide group-hover:translate-x-2 transition-transform duration-300">{title}</h3>
        <p className="text-sm text-slate-400 group-hover:text-slate-300 group-hover:translate-x-2 transition-transform duration-300 delay-75">{desc}</p>
    </button>
);

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow p-4">
      <div className="text-center mb-16">
        <h1 className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 tracking-tighter italic drop-shadow-lg">
          HOLE IN ONE
        </h1>
        <p className="text-slate-400 mt-4 text-sm sm:text-base uppercase tracking-[0.3em] font-bold">
          Precision Physics Golf
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <MenuCard 
            title="ARCADE RUN" 
            desc="60 seconds to score max goals. Rank up."
            color="bg-cyan-500"
            onClick={() => onStartGame('singleplayer')}
        />
        <MenuCard 
            title="LOCAL VERSUS" 
            desc="1v1 on the same device. Race to the hole."
            color="bg-purple-500"
            onClick={() => onStartGame('localMultiplayer')}
        />
        <MenuCard 
            title="ONLINE MATCH" 
            desc="Challenge players worldwide."
            color="bg-emerald-500"
            onClick={() => onStartGame('onlineMultiplayer')}
        />
        <MenuCard 
            title="PRACTICE RANGE" 
            desc="No timer. No pressure. Just golf."
            color="bg-amber-500"
            onClick={() => onStartGame('practice')}
        />
      </div>
      
      <div className="mt-12 text-slate-600 text-xs font-mono">
        v2.0.0 • READY PLAYER ONE
      </div>
    </div>
  );
};

export default MainMenu;
