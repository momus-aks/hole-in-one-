import React from 'react';

interface HeaderProps {
  gameDuration: number;
}

const Header: React.FC<HeaderProps> = ({ gameDuration }) => {
  return (
    <div className="text-center mb-4">
      <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
        Projection Putt
      </h1>
      <p className="text-slate-400 mt-2">
        Score as many goals as you can in {gameDuration} seconds! The timer starts on your first shot.
      </p>
    </div>
  );
};

export default Header;