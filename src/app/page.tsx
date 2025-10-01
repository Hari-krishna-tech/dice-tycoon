'use client';

import GameCanvas from '../components/GameCanvas';
import HUD from '../components/UI/HUD';
import ShopPanel from '../components/UI/ShopPanel';
import SkillTreeModal from '../components/UI/SkillTreeModal';
import { useGameStore } from '../store/gameStore';

export default function Home() {
  const { toggleSkillTree, resetGame } = useGameStore();

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden relative">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="h-screen flex flex-col relative z-10">
        {/* Mobile Layout */}
        <div className="lg:hidden h-full flex flex-col">
          {/* Top HUD - Compact */}
          <div className="flex-shrink-0 p-1">
            <HUD />
          </div>
          
          {/* Game Canvas - Takes most space */}
          <div className="flex-1 min-h-0 relative">
            <GameCanvas />
          </div>
          
          {/* Bottom Controls - Compact mobile layout */}
          <div className="flex-shrink-0 p-1 space-y-1">
            {/* Shop Panel - Horizontal scroll for dice */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl p-1">
              <h3 className="text-xs font-bold text-white mb-1">Dice Shop</h3>
              <div className="overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  <ShopPanel />
                </div>
              </div>
            </div>
            
            {/* Controls - Compact touch targets */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={toggleSkillTree}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 text-xs min-h-[40px] flex items-center justify-center"
                >
                  🌟 Skills
                </button>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25 text-xs min-h-[40px] flex items-center justify-center"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:flex-col h-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">🎲 Dice Tycoon</h1>
            <p className="text-blue-200 text-lg">Click dice to roll and earn gold in the cosmic realm!</p>
          </div>

          {/* Main Game Layout */}
          <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
            {/* Game Canvas */}
            <div className="col-span-3 flex flex-col">
              <HUD />
              <div className="flex-1 min-h-0">
                <GameCanvas />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 overflow-y-auto">
              <ShopPanel />
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl p-4">
                <h3 className="text-lg font-bold text-white mb-4">Cosmic Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={toggleSkillTree}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    🌟 Skill Tree
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                  >
                    🔄 Reset Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Tree Modal */}
        <SkillTreeModal />
      </div>
    </div>
  );
}
