'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';

const HUD: React.FC = () => {
  const { gold } = useGameStore();

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 mb-4 relative overflow-hidden">
      {/* Cosmic background effect */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="text-center relative z-10">
        <div className="text-4xl font-bold text-yellow-400 font-mono drop-shadow-lg">
          {gold.toLocaleString()}
        </div>
        <div className="text-sm text-yellow-200 font-semibold">Cosmic Gold</div>
      </div>
    </div>
  );
};

export default HUD;
