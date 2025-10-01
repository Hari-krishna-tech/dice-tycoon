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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 relative overflow-hidden">
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
      
      <h3 className="text-lg font-bold text-white mb-4 relative z-10">Cosmic Dice Shop</h3>
      
      <div className="space-y-3 relative z-10">
        {Object.entries(diceTiers)
          .filter(([_, tier]) => tier.unlocked)
          .map(([tierKey, tier]) => (
          <div key={tierKey} className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-semibold text-white">{tier.name} Die</h4>
                <p className="text-sm text-gray-300">
                  {tier.multiplier}x multiplier • {tier.count} owned
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-400 font-mono">
                  {getDiceCost(tierKey).toLocaleString()}
                </div>
                <div className="text-sm text-yellow-200">Gold</div>
              </div>
            </div>
            
            <button
              onClick={() => spawnDie(tierKey)}
              disabled={!canAfford(tierKey)}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                canAfford(tierKey)
                  ? TIER_COLORS[tierKey as keyof typeof TIER_COLORS] + ' text-white hover:shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAfford(tierKey) ? 'Spawn Die' : 'Not Enough Gold'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopPanel;
