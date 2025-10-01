'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';

const TIER_COLORS = {
  steel: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
  copper: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
  silver: 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600',
  gold: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
  emerald: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
};

const ShopPanel: React.FC = () => {
  const { gold, diceTiers, spawnDie } = useGameStore();

  const getDiceCost = (tier: string) => {
    const diceTier = diceTiers[tier];
    return Math.floor(diceTier.baseCost * Math.pow(1.15, diceTier.count));
  };

  const canAfford = (tier: string) => {
    return gold >= getDiceCost(tier);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Cosmic background effect */}
      <div className="absolute inset-0 opacity-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="space-y-1 relative z-10 lg:block flex space-x-2 lg:space-x-0 lg:space-y-1">
        {Object.entries(diceTiers)
          .filter(([_, tier]) => tier.unlocked)
          .map(([tierKey, tier]) => (
          <div key={tierKey} className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-lg p-1 shadow-lg lg:w-full w-32 flex-shrink-0">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-1">
              <div className="flex-1">
                <h4 className="font-semibold text-white text-xs truncate">{tier.name} Die</h4>
                <p className="text-xs text-gray-300">
                  {tier.multiplier}x • {tier.count}
                </p>
              </div>
              <div className="text-right lg:block">
                <div className="text-xs lg:text-sm font-bold text-yellow-400 font-mono">
                  {getDiceCost(tierKey).toLocaleString()}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => spawnDie(tierKey)}
              disabled={!canAfford(tierKey)}
              className={`w-full py-1 px-2 rounded-lg font-semibold transition-all duration-200 shadow-lg text-xs min-h-[32px] flex items-center justify-center ${
                canAfford(tierKey)
                  ? TIER_COLORS[tierKey as keyof typeof TIER_COLORS] + ' text-white hover:shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAfford(tierKey) ? 'Spawn' : 'No Gold'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopPanel;
