'use client';

import React, { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useGameStore } from '../store/gameStore';
import Dice from './Dice';

interface RippleEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface GoldPopup {
  id: string;
  x: number;
  y: number;
  amount: number;
  startTime: number;
}

const GameCanvas: React.FC = () => {
  const { dice, rollDie, updateDiePosition } = useGameStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [goldPopups, setGoldPopups] = useState<GoldPopup[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  // Handle dice roll with background effects
  const handleDiceRoll = (dieId: string) => {
    const die = dice.find(d => d.id === dieId);
    if (die) {
      // Create ripple effect
      const rippleId = `ripple-${Date.now()}-${Math.random()}`;
      const newRipple: RippleEffect = {
        id: rippleId,
        x: die.x,
        y: die.y,
        startTime: Date.now(),
        duration: 1000
      };
      setRipples(prev => [...prev, newRipple]);

      // Calculate gold earned (same logic as in store)
      const rolledNumber = Math.floor(Math.random() * 6) + 1;
      const tierMultiplier = {
        steel: 1,
        copper: 5,
        silver: 25,
        gold: 150,
        emerald: 1000
      }[die.tier];
      
      // Apply upgrades (simplified version)
      let globalMultiplier = 1;
      // Note: In a real implementation, you'd get these from the store
      // For now, we'll use a simplified calculation
      
      const goldEarned = Math.floor(rolledNumber * tierMultiplier * globalMultiplier);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 1000);

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

      // Trigger the actual dice roll
      rollDie(dieId);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-lg shadow-lg relative overflow-hidden">
      {/* Starry background */}
      <div className="absolute inset-0 opacity-40">
        {Array.from({ length: 100 }).map((_, i) => (
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
      
      {/* Animated shooting stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-80"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `shooting-star ${3 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Ripple effects from dice clicks */}
      {ripples.map((ripple) => {
        const elapsed = Date.now() - ripple.startTime;
        const progress = Math.min(elapsed / ripple.duration, 1);
        const scale = progress * 4; // Increased scale for more visibility
        const opacity = 1 - progress;
        
        return (
          <div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x - 75,
              top: ripple.y - 75,
              width: 150,
              height: 150,
              transform: `scale(${scale})`,
              opacity: opacity,
            }}
          >
            <div className="w-full h-full border-4 border-yellow-400 rounded-full animate-ping shadow-lg shadow-yellow-400/50" />
            <div className="absolute inset-0 w-full h-full border-2 border-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
          </div>
        );
      })}

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

      <style jsx>{`
        @keyframes shooting-star {
          0% {
            transform: translateX(-100px) translateY(100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100px) translateY(-100px);
            opacity: 0;
          }
        }
        
        @keyframes cosmic-burst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(3) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GameCanvas;
