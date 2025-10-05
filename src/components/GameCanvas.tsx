'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { useGameStore } from '../store/gameStore';
import Dice from './Dice';
import { TIER_DEFINITIONS } from '@/store/data/tiers';

interface GoldPopup {
  id: string;
  x: number;
  y: number;
  amount: number;
  startTime: number;
}

const GameCanvas: React.FC = () => {
  const { dice, rollDie, updateDiePosition, purchasedSkills } = useGameStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [goldPopups, setGoldPopups] = useState<GoldPopup[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const autoIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const nextIsMobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(nextIsMobile);
      if (nextIsMobile) {
        // Mobile: Use much more conservative dimensions to avoid overlap with controls
        const containerWidth = window.innerWidth - 16; // More padding
        const containerHeight = window.innerHeight - 200; // Much more conservative height to avoid controls
        
        setDimensions({
          width: Math.max(containerWidth, 280),
          height: Math.max(containerHeight, 200) // Much smaller minimum height
        });
      } else {
        // Desktop: Original sizing
        setDimensions({
          width: Math.min(window.innerWidth * 0.7, 800),
          height: Math.min(window.innerHeight * 0.6, 500)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Detect breakpoint changes and restore saved layout-specific positions
  useEffect(() => {
    dice.forEach((d) => {
      if (isMobile && d.mobileX != null && d.mobileY != null) {
        updateDiePosition(d.id, d.mobileX, d.mobileY);
      } else if (!isMobile && d.desktopX != null && d.desktopY != null) {
        updateDiePosition(d.id, d.desktopX, d.desktopY);
      }
    });
  }, [isMobile]);

  // Clamp all dice within the visible canvas whenever dimensions change or dice count changes
  useEffect(() => {
    const margin = isMobile ? 30 : 60; // Larger margin for mobile
    const dieSize = isMobile ? 40 : 60; // Account for largest die size with buffer
    const minX = margin;
    const maxX = Math.max(margin + dieSize, dimensions.width - margin - dieSize);
    const minY = margin;
    const maxY = Math.max(margin + dieSize, dimensions.height - margin - dieSize);

    dice.forEach((d) => {
      const clampedX = Math.min(Math.max(d.x, minX), maxX);
      const clampedY = Math.min(Math.max(d.y, minY), maxY);
      if (clampedX !== d.x || clampedY !== d.y) {
        updateDiePosition(d.id, clampedX, clampedY);
      }
    });
  }, [dimensions.width, dimensions.height, dice.length, isMobile]);

  // Auto-rolling automation based on skills
  useEffect(() => {
    const hasAutoMk1 = !!purchasedSkills['AUTO-03'];
    const hasAutoMk2 = !!purchasedSkills['AUTO-04'];
    const intervalMs = hasAutoMk2 ? 5000 : hasAutoMk1 ? 10000 : 0;
    if (!intervalMs) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval before setting a new one
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
    }

    autoIntervalRef.current = window.setInterval(() => {
      const { dice: latestDice, rollDie: storeRollDie } = useGameStore.getState();
      const now = Date.now();
      const eligible = latestDice.filter((d) => !d.isRolling && now - d.lastRollTime >= 300);
      if (eligible.length === 0) return;
      const chosen = eligible[Math.floor(Math.random() * eligible.length)];
      const forcedFace = Math.floor(Math.random() * 6) + 1;
      storeRollDie(chosen.id, forcedFace);
    }, intervalMs);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [purchasedSkills['AUTO-03'], purchasedSkills['AUTO-04']]);

  // Handle dice roll with background effects
  const handleDiceRoll = (dieId: string): number => {
    let rolledNumber = 0;
    const die = dice.find(d => d.id === dieId);
    if (die) {
      // Ask store to roll and compute earned gold consistently with skills
      rolledNumber = Math.floor(Math.random() * 6) + 1;
      const goldEarned = rollDie(dieId, rolledNumber);
      if (goldEarned <= 0) {
        return rolledNumber;
      }
      // No ripple cleanup needed since ripples removed

      // Show gold popup when die lands (after rolling animation)
      setTimeout(() => {
        const popupId = `gold-${Date.now()}-${Math.random()}`;
        const newPopup: GoldPopup = {
          id: popupId,
          x: die.x,
          y: die.y,
          amount: goldEarned,
          startTime: Date.now()
        };
        setGoldPopups(prev => [...prev, newPopup]);

        // Remove gold popup after short duration
        setTimeout(() => {
          setGoldPopups(prev => prev.filter(p => p.id !== popupId));
        }, 500); // Shorter duration
      }, 600); // Wait for die to land

      // Store roll already triggered above
    }
    return rolledNumber;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-lg shadow-lg relative overflow-hidden">

      {/* Ripple effects removed */}

      {/* Gold popups */}
      {goldPopups.map((popup) => {
        const elapsed = Date.now() - popup.startTime;
        const progress = Math.min(elapsed / 500, 1);
        
        // Smooth easing functions
        const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        const easeIn = Math.pow(progress, 2); // Quadratic ease-in
        
        const offsetY = -easeOut * 40; // Smooth upward movement
        const opacity = progress < 0.2 ? progress * 5 : (1 - progress) * 1.25; // Quick fade in, smooth fade out
        const scale = 0.8 + (easeOut * 0.3); // Smooth scale up
        
        return (
          <div
            key={popup.id}
            className="absolute pointer-events-none z-20 transition-all duration-75"
            style={{
              left: popup.x - 20,
              top: popup.y + offsetY - 10,
              transform: `scale(${scale})`,
              opacity: Math.max(0, Math.min(1, opacity)),
            }}
          >
            <div 
              className="text-yellow-400 font-bold text-lg drop-shadow-lg"
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 215, 0, 0.6)',
                transition: 'all 0.1s ease-out'
              }}
            >
              +{popup.amount.toLocaleString()} Gold
            </div>
          </div>
        );
      })}

      <Stage 
        width={dimensions.width} 
        height={dimensions.height} 
        className="rounded-lg relative z-10"
        style={{ touchAction: 'none' }}
      >
        <Layer>
          {dice.map((die) => (
            <Dice
              key={die.id}
              die={die}
              onRoll={handleDiceRoll}
            />
          ))}
        </Layer>
      </Stage>

      {/* Removed flashing CSS animations */}
    </div>
  );
};

export default GameCanvas;
