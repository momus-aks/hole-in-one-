import React from 'react';

interface WaitingRoomProps {
    onCancel: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ onCancel }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-[660px]">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white animate-pulse">
          Searching for an opponent...
        </h2>
        <p className="text-slate-400 mt-4 text-lg">
          Connecting to the server and waiting for another player to join.
        </p>
      </div>
      <div className="w-64">
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-cyan-400 h-2.5 rounded-full animate-loader"></div>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="mt-12 px-8 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-all duration-300"
      >
        Cancel
      </button>
      <style>{`
        @keyframes loader {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loader {
          animation: loader 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WaitingRoom;
