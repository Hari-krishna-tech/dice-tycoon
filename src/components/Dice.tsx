'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { useGameStore } from '../store/gameStore';

interface DiceProps {
  die: {
    id: string;
    tier: 'steel' | 'copper' | 'silver' | 'gold' | 'emerald' | 'platinum' | 'diamond' | 'ruby' | 'obsidian';
    x: number;
    y: number;
    currentFace: number;
    isRolling: boolean;
  };
  onRoll: (dieId: string) => number;
}

const DICE_COLORS = {
  steel: '#7A7A7A',
  copper: '#B87333',
  silver: '#E5E5E5',
  gold: '#FFD700',
  emerald: '#50C878',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  ruby: '#E0115F',
  obsidian: '#2B2B2B',
};

const DICE_SIZES = {
  steel: 40,
  copper: 40,
  silver: 40,
  gold: 40,
  emerald: 40,
  platinum: 40,
  diamond: 40,
  ruby: 40,
  obsidian: 40,
};

const MOBILE_DICE_SIZES = {
  steel: 25,
  copper: 25,
  silver: 25,
  gold: 25,
  emerald: 25,
  platinum: 25,
  diamond: 25,
  ruby: 25,
  obsidian: 25,
};

const Dice: React.FC<DiceProps> = ({ die, onRoll }) => {
  const groupRef = useRef<any>(null);
  const [currentRollingFace, setCurrentRollingFace] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rollDirection, setRollDirection] = useState<{x: number, y: number}>({x: 1, y: 1});
  const [isActuallyRolling, setIsActuallyRolling] = useState(false);
  const { updateDiePosition, purchasedSkills } = useGameStore();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const size = isMobile ? MOBILE_DICE_SIZES[die.tier] : DICE_SIZES[die.tier];
  const color = DICE_COLORS[die.tier];
  const hoverEnabled = !!purchasedSkills['AUTO-01'];
  const hoverRadiusMultiplier = purchasedSkills['AUTO-02'] ? 1.3 : 1.0;
  const hoverSize = size * hoverRadiusMultiplier;
  const lastHoverRollTimeRef = useRef<number>(0);
  const hoverDebounceMs = 50; // Low debounce for near-immediate hover response

  // Realistic rolling animation with multiple face changes
  useEffect(() => {
    if (die.isRolling && !isAnimating) {
      setIsAnimating(true);
      
      // Set random direction for this roll
      setRollDirection({
        x: (Math.random() - 0.5) * 2, // -1 to 1
        y: (Math.random() - 0.5) * 2   // -1 to 1
      });
      
      // Animate through random faces with decreasing speed (like the reference)
      let currentIndex = 0;
      let delay = 35; // Start fast
      const totalFrames = 12; // Fewer frames to reduce work per roll
      
      const animateSequence = () => {
        if (currentIndex < totalFrames) {
          // Show random face with weighted probability (like real dice)
          const faces = [1, 2, 3, 4, 5, 6];
          setCurrentRollingFace(faces[Math.floor(Math.random() * faces.length)]);
          currentIndex++;
          delay = Math.min(delay + 8, 110); // Gradually slow down with fewer steps
          setTimeout(animateSequence, delay);
        } else {
          setIsAnimating(false);
        }
      };
      
      animateSequence();
    }
  }, [die.isRolling, isAnimating]);

  // Physics-based animation using requestAnimationFrame
  useEffect(() => {
    if (die.isRolling && groupRef.current) {
      setIsActuallyRolling(true); // Set rolling state when animation starts
      let startTime = Date.now();
      const duration = 400; // Shorter animation for smoother feel
      const originalX = die.x;
      const originalY = die.y;
      
      // Calculate final position immediately with canvas bounds
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      let canvasWidth, canvasHeight;
      if (isMobile) {
        canvasWidth = Math.max(window.innerWidth - 16, 280); // More conservative
        canvasHeight = Math.max(window.innerHeight - 200, 200); // Much more conservative to avoid controls
      } else {
        canvasWidth = Math.min(window.innerWidth * 0.7, 800);
        canvasHeight = Math.min(window.innerHeight * 0.6, 500);
      }
      const margin = isMobile ? 30 : 60; // Larger margin for mobile
      const maxMovement = isMobile ? 20 : 60; // Smaller movement for mobile
      
      // Calculate safe movement range with proper bounds
      const dieSize = isMobile ? 40 : 60; // Match store calculation
      const minX = margin;
      const maxX = Math.max(margin + dieSize, canvasWidth - margin - dieSize);
      const minY = margin;
      const maxY = Math.max(margin + dieSize, canvasHeight - margin - dieSize);
      
      // Calculate safe movement range
      const maxOffsetX = Math.min(
        maxMovement, 
        maxX - originalX, 
        originalX - minX
      );
      const maxOffsetY = Math.min(
        maxMovement, 
        maxY - originalY, 
        originalY - minY
      );
      
      // Ensure final position is within bounds
      const finalX = Math.max(minX, Math.min(maxX, originalX + (Math.random() - 0.5) * maxOffsetX));
      const finalY = Math.max(minY, Math.min(maxY, originalY + (Math.random() - 0.5) * maxOffsetY));
      
      // Don't update store immediately - wait for animation to complete
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (groupRef.current && progress < 1) {
          // More realistic easing with multiple phases
          let easeOut;
          if (progress < 0.6) {
            // Fast spinning phase
            easeOut = progress * 1.6;
          } else {
            // Deceleration phase
            const decelProgress = (progress - 0.6) / 0.4;
            easeOut = 0.96 + (0.04 * (1 - Math.pow(1 - decelProgress, 3)));
          }
          
          // 3D dice rolling animation with multiple axis rotations
          const flipCount = 3; // Number of complete rotations
          const totalRotation = progress * flipCount * 360; // Full rotations
          
          // Set rotation origin to dice center
          groupRef.current.offsetX(size / 2);
          groupRef.current.offsetY(size / 2);
          
          // Multiple axis rotation for realistic 3D tumbling
          const rotationX = Math.sin(progress * Math.PI * 4) * 180; // X-axis tumbling
          const rotationY = Math.cos(progress * Math.PI * 3) * 180; // Y-axis tumbling  
          const rotationZ = totalRotation; // Z-axis spinning
          
          // Apply combined rotation
          groupRef.current.rotation(rotationZ);
          // Note: Konva doesn't support 3D rotations directly, so we use Z-axis rotation
          // This creates a spinning effect that simulates 3D tumbling
          
          // Realistic dice tumbling movement (inspired by the reference)
          const tumbleHeight = Math.sin(progress * Math.PI * 8) * 25 * Math.pow(1 - progress, 1.3);
          const tumbleSide = Math.sin(progress * Math.PI * 6) * 10 * Math.pow(1 - progress, 1.1);
          
          // Interpolate between original and final position
          const interpolatedX = originalX + (finalX - originalX) * progress;
          const interpolatedY = originalY + (finalY - originalY) * progress;
          
          // Add tumbling effects
          let newX = interpolatedX + (tumbleSide * rollDirection.x);
          let newY = interpolatedY - (tumbleHeight * Math.abs(rollDirection.y));
          
          // Clamp position to stay within bounds during animation
          newX = Math.max(minX, Math.min(maxX, newX));
          newY = Math.max(minY, Math.min(maxY, newY));
          
          // Force update position
          groupRef.current.setPosition({ x: newX, y: newY });
          
          // Scale effect during backflip - subtle compression
          const scaleBounce = 1 + (Math.sin(progress * Math.PI * 8) * 0.08 * Math.pow(1 - progress, 2));
          groupRef.current.scaleX(scaleBounce);
          groupRef.current.scaleY(scaleBounce);
          
          // Rely on Konva's internal redraw; avoid forcing batchDraw every frame

          requestAnimationFrame(animate);
        } else if (groupRef.current) {
          // Land at the final position
          groupRef.current.rotation(0);
          groupRef.current.offsetX(0);
          groupRef.current.offsetY(0);
          groupRef.current.setPosition({ x: finalX, y: finalY });
          groupRef.current.scaleX(1);
          groupRef.current.scaleY(1);
          
          // Update store with final position when animation completes
          updateDiePosition(die.id, finalX, finalY);
          
          // Reset rolling state when animation ends
          setIsActuallyRolling(false);
          
        }
      };
      
      animate();
    } else if (groupRef.current) {
      groupRef.current.rotation(0);
      groupRef.current.offsetX(0);
      groupRef.current.offsetY(0);
      groupRef.current.setPosition({ x: die.x, y: die.y });
      groupRef.current.scaleX(1);
      groupRef.current.scaleY(1);
    }
  }, [die.isRolling, die.x, die.y, rollDirection]);

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    if (!die.isRolling) {
      setCurrentRollingFace(onRoll(die.id));
    }
  };

  const handleTouchStart = (e: any) => {
    e.cancelBubble = true;
    if (!die.isRolling) {
      setCurrentRollingFace(onRoll(die.id));
    }
  };

  const handleMouseEnter = () => {
    if (groupRef.current && !die.isRolling) {
      groupRef.current.scaleX(1.1);
      groupRef.current.scaleY(1.1);
    }
  };

  const handleMouseLeave = () => {
    if (groupRef.current && !die.isRolling) {
      groupRef.current.scaleX(1);
      groupRef.current.scaleY(1);
    }
  };

  // Render dice face dots
  const renderDots = (face: number) => {
    const dots: React.ReactElement[] = [];
    const dotSize = size * 0.08;
    const spacing = size * 0.2;
    const centerX = size / 2;
    const centerY = size / 2;

    const positions: { [key: number]: number[][] } = {
      1: [[centerX, centerY]],
      2: [[centerX - spacing, centerY - spacing], [centerX + spacing, centerY + spacing]],
      3: [[centerX - spacing, centerY - spacing], [centerX, centerY], [centerX + spacing, centerY + spacing]],
      4: [[centerX - spacing, centerY - spacing], [centerX + spacing, centerY - spacing], 
          [centerX - spacing, centerY + spacing], [centerX + spacing, centerY + spacing]],
      5: [[centerX - spacing, centerY - spacing], [centerX + spacing, centerY - spacing], 
          [centerX, centerY], [centerX - spacing, centerY + spacing], [centerX + spacing, centerY + spacing]],
      6: [[centerX - spacing, centerY - spacing], [centerX + spacing, centerY - spacing], 
          [centerX - spacing, centerY], [centerX + spacing, centerY], 
          [centerX - spacing, centerY + spacing], [centerX + spacing, centerY + spacing]],
    };

    const facePositions = positions[face] || positions[1];
    
    facePositions.forEach(([x, y], index) => {
      dots.push(
        <Circle
          key={index}
          x={x}
          y={y}
          radius={dotSize}
          fill="#000"
        />
      );
    });

    return dots;
  };

  // Get the current face to display (either rolling face or final face)
  const currentDisplayFace = die.isRolling ? currentRollingFace : die.currentFace;

  return (
    <Group
      ref={groupRef}
      x={die.x}
      y={die.y}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dice body */}
      <Rect
        width={size}
        height={size}
        fill={isActuallyRolling ? '#FFD700' : color}
        stroke={isActuallyRolling ? '#FFA500' : '#000'}
        strokeWidth={isActuallyRolling ? 3 : 2}
        cornerRadius={8}
        shadowColor={isActuallyRolling ? '#FFA500' : '#000'}
        shadowBlur={isActuallyRolling ? 8 : 5}
        shadowOffset={{ x: isActuallyRolling ? 3 : 2, y: isActuallyRolling ? 3 : 2 }}
        shadowOpacity={isActuallyRolling ? 0.6 : 0.3}
      />
      
      {/* Dice face dots */}
      {renderDots(currentDisplayFace)}

      {/* Hover activation area (transparent, placed last to be on top) */}
      {hoverEnabled && (
        <Rect
          x={-(hoverSize - size) / 2}
          y={-(hoverSize - size) / 2}
          width={hoverSize}
          height={hoverSize}
          fill={'rgba(0,0,0,0.001)'}
          listening={true}
          onMouseEnter={(e) => {
            e.cancelBubble = true;
            const now = Date.now();
            if (now - lastHoverRollTimeRef.current < hoverDebounceMs) return;
            if (!die.isRolling) {
              lastHoverRollTimeRef.current = now;
              setCurrentRollingFace(onRoll(die.id));
            }
          }}
          onMouseMove={(e) => {
            e.cancelBubble = true;
            const now = Date.now();
            if (now - lastHoverRollTimeRef.current < hoverDebounceMs) return;
            if (!die.isRolling) {
              lastHoverRollTimeRef.current = now;
              setCurrentRollingFace(onRoll(die.id));
            }
          }}
          onTouchStart={(e) => {
            e.cancelBubble = true;
            const now = Date.now();
            if (now - lastHoverRollTimeRef.current < hoverDebounceMs) return;
            if (!die.isRolling) {
              lastHoverRollTimeRef.current = now;
              setCurrentRollingFace(onRoll(die.id));
            }
          }}
        />
      )}
    </Group>
  );
};

export default Dice;
