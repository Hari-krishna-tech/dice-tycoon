'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SKILL_DEFINITIONS } from '../../store/data/skills';

interface TreeNode {
  id: string;
  x: number;
  y: number;
  tier: number;
}

const SkillTreeModal: React.FC = () => {
  const { skillTreeOpen, toggleSkillTree, gold, purchasedSkills, purchaseSkill } = useGameStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Auto-layout from CSV skills grouped by branch and depth (BFS by prerequisites)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const branchOrder = ['Main', 'Luck', 'Automation', 'Face Value'] as const;
  const horizontalGap = isMobile ? 120 : 200;
  const verticalGap = isMobile ? 80 : 100;
  const startX = isMobile ? 100 : 120;
  const startY = isMobile ? 80 : 80;

  const treeLayout: TreeNode[] = useMemo(() => {
    const byBranch: Record<string, typeof SKILL_DEFINITIONS> = {} as any;
    branchOrder.forEach((b) => {
      byBranch[b] = SKILL_DEFINITIONS.filter((s) => s.branch === b);
    });

    const positions: TreeNode[] = [];
    branchOrder.forEach((branch, branchIdx) => {
      const skills = byBranch[branch];
      // Determine depth via prerequisites count chain (simple heuristic)
      const depthMap: Record<string, number> = {};
      const resolveDepth = (id: string): number => {
        if (depthMap[id] != null) return depthMap[id];
        const s = skills.find((x) => x.id === id) || SKILL_DEFINITIONS.find((x)=>x.id===id);
        if (!s || s.prerequisites.length === 0) {
          depthMap[id] = 0; return 0;
        }
        const depth = 1 + Math.max(...s.prerequisites.map((p) => resolveDepth(p)));
        depthMap[id] = depth;
        return depth;
      };
      skills.forEach((s) => resolveDepth(s.id));

      const skillsByDepth: Record<number, string[]> = {};
      skills.forEach((s) => {
        const d = depthMap[s.id] || 0;
        if (!skillsByDepth[d]) skillsByDepth[d] = [];
        skillsByDepth[d].push(s.id);
      });

      const branchX = startX + branchIdx * horizontalGap;

      if (branch === 'Main') {
        // Wrap the long Main branch into serpentine columns
        const columnGap = isMobile ? 160 : 200;
        const rowsPerColumn = isMobile ? 6 : 8;
        const ordered = [...skills].sort((a, b) => (depthMap[a.id] || 0) - (depthMap[b.id] || 0));
        ordered.forEach((s, idx) => {
          const col = Math.floor(idx / rowsPerColumn);
          const row = idx % rowsPerColumn;
          const goingDown = col % 2 === 0; // even columns go down, odd go up
          const yRow = goingDown ? row : (rowsPerColumn - 1 - row);
          const x = branchX - col * columnGap;
          const y = startY + yRow * verticalGap;
          positions.push({ id: s.id, x, y, tier: yRow });
        });
      } else {
        // Default layout: by depth tiers, slight horizontal jitter for siblings
        const maxDepth = Math.max(0, ...Object.keys(skillsByDepth).map((k) => parseInt(k)));
        for (let d = 0; d <= maxDepth; d++) {
          const ids = skillsByDepth[d] || [];
          ids.forEach((id, i) => {
            const x = branchX + (isMobile ? 0 : (i - (ids.length - 1) / 2) * 120);
            const y = startY + d * verticalGap;
            positions.push({ id, x, y, tier: d });
          });
        }
      }
    });
    return positions;
  }, [isMobile]);

  // Visibility: show node only when all prerequisites are purchased (or no prerequisites)
  const isNodeVisible = (skillId: string) => {
    const def = SKILL_DEFINITIONS.find(s => s.id === skillId);
    if (!def) return false;
    return def.prerequisites.every(p => purchasedSkills[p]);
  };

  const visibleNodes = useMemo(() => treeLayout.filter(n => isNodeVisible(n.id)), [treeLayout, purchasedSkills]);

  // Compute bounding box for centering
  const layoutMetrics = useMemo(() => {
    if (visibleNodes.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
    const minX = Math.min(...visibleNodes.map(n => n.x));
    const minY = Math.min(...visibleNodes.map(n => n.y));
    const maxX = Math.max(...visibleNodes.map(n => n.x));
    const maxY = Math.max(...visibleNodes.map(n => n.y));
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [visibleNodes]);

  const isSkillAvailable = (skillId: string) => {
    const skill = SKILL_DEFINITIONS.find(s => s.id === skillId);
    if (!skill) return false;
    if (purchasedSkills[skillId]) return false;
    return skill.prerequisites.every(p => purchasedSkills[p]);
  };

  const canAffordSkill = (skillId: string) => {
    const skill = SKILL_DEFINITIONS.find(s => s.id === skillId);
    return !!skill && gold >= skill.cost;
  };

  const getSkillStatus = (skillId: string) => {
    if (purchasedSkills[skillId]) return 'maxed';
    if (!isSkillAvailable(skillId)) return 'locked';
    if (!canAffordSkill(skillId)) return 'unaffordable';
    return 'available';
  };

  const getNodeStyle = (status: string) => {
    const nodeSize = isMobile ? 'w-12 h-12' : 'w-16 h-16';
    const borderWidth = isMobile ? 'border-2' : 'border-4';
    const textSize = isMobile ? 'text-xs' : 'text-xs';
    const baseStyle = `${nodeSize} ${borderWidth} rounded-lg flex items-center justify-center text-white font-bold ${textSize} transition-all duration-200`;
    
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

  const getNodeIcon = (skillId: string) => {
    if (skillId.startsWith('MAIN')) return '🛠️';
    if (skillId.startsWith('LUCK')) return '🎲';
    if (skillId.startsWith('AUTO')) return '⚙️';
    if (skillId.startsWith('FACE')) return '🧊';
    return '⭐';
  };

  const getConnections = () => {
    const connections: Array<{ from: TreeNode; to: TreeNode }> = [];
    treeLayout.forEach(node => {
      const skill = SKILL_DEFINITIONS.find(s => s.id === node.id);
      if (skill) {
        skill.prerequisites.forEach(prereqId => {
          const prereqNode = treeLayout.find(n => n.id === prereqId);
          if (prereqNode) connections.push({ from: prereqNode, to: node });
        });
      }
    });
    
    return connections;
  };

  if (!skillTreeOpen) return null;

  const connections = getConnections().filter(({ to }) => visibleNodes.find(n => n.id === to.id));
  const padding = isMobile ? 40 : 80;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMobile ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 shadow-xl overflow-hidden relative w-full h-full rounded-none`}>
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

        <div className={`relative z-10 ${isMobile ? 'p-4 h-full flex flex-col' : 'p-3 sm:p-6'}`}>
          <div className={`flex justify-between items-center ${isMobile ? 'mb-4' : 'mb-4 sm:mb-6'}`}>
            <div className="text-white">
              <h2 className={`${isMobile ? 'text-2xl' : 'text-xl sm:text-3xl'} font-bold mb-1 sm:mb-2`}>Skill Tree</h2>
              <div className={`text-yellow-400 ${isMobile ? 'text-lg' : 'text-sm sm:text-xl'} font-mono`}>
                {gold.toLocaleString()} Cosmic Gold
              </div>
            </div>
            <button
              onClick={toggleSkillTree}
              className={`text-white hover:text-red-400 font-bold bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors ${
                isMobile ? 'text-2xl w-10 h-10' : 'text-2xl sm:text-3xl w-8 h-8 sm:w-10 sm:h-10'
              }`}
            >
              ×
            </button>
          </div>

          <div className={`relative overflow-auto flex-1`} style={{ 
            height: 'calc(100vh - 120px)', 
            width: '100%'
          }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative" style={{ width: layoutMetrics.width + padding * 2, height: layoutMetrics.height + padding * 2 }}>
                {/* Connection lines inside centered graph */}
                <svg className="absolute inset-0" width={layoutMetrics.width + padding * 2} height={layoutMetrics.height + padding * 2} style={{ zIndex: 1 }}>
                  {connections.map((connection, index) => {
                    const nodeCenter = isMobile ? 24 : 32;
                    const fromX = (connection.from.x - layoutMetrics.minX) + padding;
                    const fromY = (connection.from.y - layoutMetrics.minY) + padding + nodeCenter;
                    const toX = (connection.to.x - layoutMetrics.minX) + padding;
                    const toY = (connection.to.y - layoutMetrics.minY) + padding + nodeCenter;
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

                {/* Skill nodes (only visible) inside centered graph */}
                {visibleNodes.map((node) => {
                  const def = SKILL_DEFINITIONS.find(s => s.id === node.id);
                  if (!def) return null;
                  const status = getSkillStatus(node.id);
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{
                        left: (node.x - layoutMetrics.minX) + padding - (isMobile ? 24 : 32),
                        top: (node.y - layoutMetrics.minY) + padding - (isMobile ? 24 : 32),
                        zIndex: 2,
                      }}
                    >
                      <div
                        className={getNodeStyle(status)}
                        onClick={() => {
                          if (status === 'available' || status === 'unaffordable') purchaseSkill(node.id);
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
                        {def.name.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}

                {/* Tooltip inside centered graph, clamped to container bounds */}
                {hoveredNode && SKILL_DEFINITIONS.find(s=>s.id===hoveredNode) && (() => {
                  const n = visibleNodes.find(n => n.id === hoveredNode) || treeLayout.find(n => n.id === hoveredNode);
                  if (!n) return null;
                  const containerW = layoutMetrics.width + padding * 2;
                  const containerH = layoutMetrics.height + padding * 2;
                  const nodeX = (n.x - layoutMetrics.minX) + padding;
                  const nodeY = (n.y - layoutMetrics.minY) + padding;
                  const estTooltipW = isMobile ? 200 : 320;
                  const estTooltipH = isMobile ? 100 : 140;
                  // Offset tooltip to the right of the node (avoid overlap) with small vertical offset
                  const desiredLeft = nodeX + (isMobile ? 60 : 80);
                  const desiredTop = nodeY - (isMobile ? 20 : 0);
                  const left = Math.max(8, Math.min(desiredLeft, containerW - estTooltipW - 8));
                  const top = Math.max(8, Math.min(desiredTop, containerH - estTooltipH - 8));
                  return (
                    <div
                      className={`absolute bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 text-white text-xs sm:text-sm z-50 pointer-events-none ${
                        isMobile ? 'text-center' : ''
                      }`}
                      style={{ left, top, maxWidth: isMobile ? 200 : 320 }}
                    >
                      <div className="font-bold text-yellow-400 mb-1">
                        {SKILL_DEFINITIONS.find(s=>s.id===hoveredNode)!.name}
                      </div>
                      <div className="text-gray-300 mb-2">
                        {SKILL_DEFINITIONS.find(s=>s.id===hoveredNode)!.description}
                      </div>
                      <div className="text-sm">
                        <div className="text-green-400">
                          Cost: {SKILL_DEFINITIONS.find(s=>s.id===hoveredNode)!.cost.toLocaleString()} Gold
                        </div>
                        {SKILL_DEFINITIONS.find(s=>s.id===hoveredNode)!.prerequisites.length > 0 && (
                          <div className="text-gray-400 text-xs mt-1">
                            Requires: {SKILL_DEFINITIONS.find(s=>s.id===hoveredNode)!.prerequisites.map(prereq => 
                              SKILL_DEFINITIONS.find(s=>s.id===prereq)?.name || prereq
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTreeModal;
