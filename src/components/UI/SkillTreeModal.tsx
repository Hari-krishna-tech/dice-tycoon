'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface TreeNode {
  id: string;
  x: number;
  y: number;
  tier: number;
}

const SkillTreeModal: React.FC = () => {
  const { skillTreeOpen, toggleSkillTree, upgrades, gold, purchaseUpgrade } = useGameStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Define the visual tree layout
  const treeLayout: TreeNode[] = [
    { id: 'steelMultiplier', x: 200, y: 100, tier: 0 },
    { id: 'unlockCopper', x: 100, y: 200, tier: 1 },
    { id: 'luckyRolls', x: 300, y: 200, tier: 1 },
    { id: 'copperMultiplier', x: 50, y: 300, tier: 2 },
    { id: 'rollSpeed', x: 150, y: 300, tier: 2 },
    { id: 'sixesBonus', x: 250, y: 300, tier: 2 },
    { id: 'hoverRadius', x: 350, y: 300, tier: 2 },
  ];

  const isUpgradeAvailable = (upgradeId: string) => {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return false;
    
    // Check if prerequisites are met
    for (const prereq of upgrade.prerequisites) {
      if (!upgrades[prereq] || upgrades[prereq].level === 0) {
        return false;
      }
    }
    
    return upgrade.level < upgrade.maxLevel;
  };

  const canAffordUpgrade = (upgradeId: string) => {
    const upgrade = upgrades[upgradeId];
    return upgrade && gold >= upgrade.cost;
  };

  const getUpgradeStatus = (upgradeId: string) => {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return 'locked';
    
    if (upgrade.level >= upgrade.maxLevel) return 'maxed';
    if (!isUpgradeAvailable(upgradeId)) return 'locked';
    if (!canAffordUpgrade(upgradeId)) return 'unaffordable';
    return 'available';
  };

  const getNodeStyle = (status: string) => {
    const baseStyle = 'w-16 h-16 border-4 rounded-lg flex items-center justify-center text-white font-bold text-xs transition-all duration-200';
    
    switch (status) {
      case 'available':
        return `${baseStyle} bg-green-500 border-green-600 hover:bg-green-600 cursor-pointer`;
      case 'unaffordable':
        return `${baseStyle} bg-yellow-500 border-yellow-600 hover:bg-yellow-600 cursor-pointer`;
      case 'maxed':
        return `${baseStyle} bg-blue-500 border-blue-600 cursor-default`;
      case 'locked':
        return `${baseStyle} bg-gray-400 border-gray-500 cursor-not-allowed opacity-50`;
      default:
        return `${baseStyle} bg-gray-400 border-gray-500`;
    }
  };

  const getNodeIcon = (upgradeId: string) => {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return '🔒';
    
    if (upgradeId.includes('Multiplier')) return '💰';
    if (upgradeId.includes('unlock')) return '🔓';
    if (upgradeId.includes('lucky') || upgradeId.includes('sixes')) return '🎲';
    if (upgradeId.includes('speed') || upgradeId.includes('radius')) return '⚡';
    return '⭐';
  };

  const getConnections = () => {
    const connections: Array<{ from: TreeNode; to: TreeNode }> = [];
    
    treeLayout.forEach(node => {
      const upgrade = upgrades[node.id];
      if (upgrade) {
        upgrade.prerequisites.forEach(prereqId => {
          const prereqNode = treeLayout.find(n => n.id === prereqId);
          if (prereqNode) {
            connections.push({ from: prereqNode, to: node });
          }
        });
      }
    });
    
    return connections;
  };

  if (!skillTreeOpen) return null;

  const connections = getConnections();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden relative">
        {/* Starry background */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Skill Tree</h2>
              <div className="text-yellow-400 text-xl font-mono">
                {gold.toLocaleString()} Cosmic Gold
              </div>
            </div>
            <button
              onClick={toggleSkillTree}
              className="text-white hover:text-red-400 text-3xl font-bold bg-red-600 hover:bg-red-700 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          <div className="relative" style={{ height: '500px', width: '100%' }}>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {connections.map((connection, index) => {
                const fromX = connection.from.x;
                const fromY = connection.from.y + 32; // Center of node
                const toX = connection.to.x;
                const toY = connection.to.y + 32;
                
                return (
                  <line
                    key={index}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                );
              })}
            </svg>

            {/* Skill nodes */}
            {treeLayout.map((node) => {
              const upgrade = upgrades[node.id];
              if (!upgrade) return null;
              
              const status = getUpgradeStatus(node.id);
              const isMaxed = upgrade.level >= upgrade.maxLevel;
              
              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: node.x - 32,
                    top: node.y - 32,
                    zIndex: 2,
                  }}
                >
                  <div
                    className={getNodeStyle(status)}
                    onClick={() => {
                      if (status === 'available' || status === 'unaffordable') {
                        purchaseUpgrade(node.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div className="text-center">
                      <div className="text-lg">{getNodeIcon(node.id)}</div>
                      {status === 'locked' && <div className="text-xs">🔒</div>}
                    </div>
                  </div>
                  
                  {/* Node label */}
                  <div className="text-white text-xs text-center mt-1 max-w-20">
                    {upgrade.name.split(' ')[0]}
                  </div>
                  
                  {/* Level indicator */}
                  {upgrade.level > 0 && (
                    <div className="text-yellow-400 text-xs text-center mt-1">
                      {upgrade.level}/{upgrade.maxLevel}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tooltip */}
            {hoveredNode && upgrades[hoveredNode] && (
              <div
                className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm max-w-64 z-50"
                style={{
                  left: treeLayout.find(n => n.id === hoveredNode)?.x ? 
                    Math.min(treeLayout.find(n => n.id === hoveredNode)!.x + 50, 400) : 0,
                  top: treeLayout.find(n => n.id === hoveredNode)?.y ? 
                    treeLayout.find(n => n.id === hoveredNode)!.y - 50 : 0,
                }}
              >
                <div className="font-bold text-yellow-400 mb-1">
                  {upgrades[hoveredNode].name}
                </div>
                <div className="text-gray-300 mb-2">
                  {upgrades[hoveredNode].description}
                </div>
                <div className="text-sm">
                  <div className="text-yellow-400">
                    Level: {upgrades[hoveredNode].level}/{upgrades[hoveredNode].maxLevel}
                  </div>
                  <div className="text-green-400">
                    Cost: {upgrades[hoveredNode].cost.toLocaleString()} Gold
                  </div>
                  {upgrades[hoveredNode].prerequisites.length > 0 && (
                    <div className="text-gray-400 text-xs mt-1">
                      Requires: {upgrades[hoveredNode].prerequisites.map(prereq => 
                        upgrades[prereq]?.name || prereq
                      ).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTreeModal;
