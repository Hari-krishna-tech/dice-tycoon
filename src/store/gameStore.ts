import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Die {
  id: string;
  tier: 'steel' | 'copper' | 'silver' | 'gold' | 'emerald' | 'platinum' | 'diamond' | 'ruby' | 'obsidian';
  x: number;
  y: number;
  // Persist last-known positions for each layout so we can restore across breakpoints
  desktopX?: number;
  desktopY?: number;
  mobileX?: number;
  mobileY?: number;
  currentFace: number;
  isRolling: boolean;
  lastRollTime: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  effect: number;
  prerequisites: string[];
  unlocks: string[];
}

export interface DiceTier {
  name: string;
  baseCost: number;
  multiplier: number;
  unlocked: boolean;
  count: number;
}

export interface GameState {
  // Core state
  gold: number;
  dice: Die[];
  diceTiers: Record<string, DiceTier>;
  upgrades: Record<string, Upgrade>;
  // CSV-driven skills
  purchasedSkills: Record<string, boolean>;
  
  // UI state
  skillTreeOpen: boolean;
  
  // Actions
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  spawnDie: (tier: string) => void;
  rollDie: (dieId: string, rolledNumber?: number) => number;
  updateDiePosition: (dieId: string, x: number, y: number) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  purchaseSkill: (skillId: string) => void;
  toggleSkillTree: () => void;
  resetGame: () => void;
}

// Data-driven dice tier configuration
import { TIER_DEFINITIONS, TierKey } from './data/tiers';

const buildInitialDiceTiers = (): Record<string, DiceTier> => {
  const tiers: Record<string, DiceTier> = {};
  (Object.keys(TIER_DEFINITIONS) as TierKey[]).forEach((key) => {
    const def = TIER_DEFINITIONS[key];
    tiers[key] = {
      name: def.name,
      baseCost: def.baseCost,
      multiplier: def.multiplier,
      unlocked: def.unlockedBy === 'start',
      count: 0,
    };
  });
  return tiers;
};

// Keep legacy upgrades for gameplay multipliers (independent of CSV skills)
const SKILL_TREE: Record<string, Upgrade> = {
  steelMultiplier: {
    id: 'steelMultiplier',
    name: 'Steel Die Multiplier',
    description: 'Increases gold earned from Steel dice by +10% per level',
    level: 0,
    maxLevel: 10,
    cost: 50,
    effect: 0.1,
    prerequisites: [],
    unlocks: ['unlockCopper', 'luckyRolls'],
  },
  unlockCopper: {
    id: 'unlockCopper',
    name: 'Unlock Copper Dice',
    description: 'Allows purchasing Copper dice',
    level: 0,
    maxLevel: 1,
    cost: 1000,
    effect: 0,
    prerequisites: ['steelMultiplier'],
    unlocks: ['copperMultiplier'],
  },
  copperMultiplier: {
    id: 'copperMultiplier',
    name: 'Copper Die Multiplier',
    description: 'Increases gold earned from Copper dice by +15% per level',
    level: 0,
    maxLevel: 10,
    cost: 200,
    effect: 0.15,
    prerequisites: ['unlockCopper'],
    unlocks: [],
  },
  luckyRolls: {
    id: 'luckyRolls',
    name: 'Lucky Rolls',
    description: 'Increases probability of rolling 4, 5, or 6',
    level: 0,
    maxLevel: 20,
    cost: 500,
    effect: 0.05,
    prerequisites: ['steelMultiplier'],
    unlocks: ['sixesBonus'],
  },
  rollSpeed: {
    id: 'rollSpeed',
    name: 'Roll Speed',
    description: 'Reduces roll animation time by 5% per level',
    level: 0,
    maxLevel: 15,
    cost: 300,
    effect: 0.05,
    prerequisites: ['unlockCopper'],
    unlocks: ['hoverRadius'],
  },
  hoverRadius: {
    id: 'hoverRadius',
    name: 'Hover Radius',
    description: 'Increases mouse hover detection radius by 5 pixels per level',
    level: 0,
    maxLevel: 10,
    cost: 400,
    effect: 5,
    prerequisites: ['rollSpeed'],
    unlocks: [],
  },
  sixesBonus: {
    id: 'sixesBonus',
    name: 'Sixes Bonus',
    description: 'Grants 2x bonus when rolling a 6',
    level: 0,
    maxLevel: 1,
    cost: 5000,
    effect: 2,
    prerequisites: ['luckyRolls'],
    unlocks: [],
  },
};

// CSV-driven skills data
import { SKILL_DEFINITIONS } from './data/skills';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      gold: 100,
      dice: [],
      diceTiers: buildInitialDiceTiers(),
      upgrades: { ...SKILL_TREE },
      purchasedSkills: {},
      skillTreeOpen: false,

      // Actions
      addGold: (amount: number) => {
        set((state) => ({ gold: state.gold + amount }));
      },

      spendGold: (amount: number) => {
        const state = get();
        if (state.gold >= amount) {
          set((state) => ({ gold: state.gold - amount }));
          return true;
        }
        return false;
      },

      spawnDie: (tier: string) => {
        const state = get();
        const diceTier = state.diceTiers[tier];
        
        if (!diceTier || !diceTier.unlocked) return;

        // Calculate cost with exponential scaling
        const cost = Math.floor(diceTier.baseCost * Math.pow(1.15, diceTier.count));
        
        if (state.spendGold(cost)) {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
          
          // Use more conservative canvas dimensions for mobile
          let canvasWidth, canvasHeight;
          if (isMobile) {
            // Much more conservative mobile dimensions to avoid controls
            canvasWidth = Math.max(window.innerWidth - 16, 280); // More padding
            canvasHeight = Math.max(window.innerHeight - 200, 200); // Much more conservative height
          } else {
            canvasWidth = Math.min(window.innerWidth * 0.7, 800);
            canvasHeight = Math.min(window.innerHeight * 0.6, 500);
          }
          
          const margin = isMobile ? 30 : 60; // Larger margin for mobile
          const dieSize = isMobile ? 40 : 60; // Account for largest die size with some buffer

          const minX = margin;
          const maxX = Math.max(margin + dieSize, canvasWidth - margin - dieSize);
          const minY = margin;
          const maxY = Math.max(margin + dieSize, canvasHeight - margin - dieSize);


          // Ensure we have valid bounds
          let randX, randY;
          if (maxX <= minX || maxY <= minY) {
            // Fallback to center if bounds are invalid
            randX = Math.max(margin, Math.min(canvasWidth - margin - dieSize, canvasWidth / 2));
            randY = Math.max(margin, Math.min(canvasHeight - margin - dieSize, canvasHeight / 2));
          } else {
            randX = Math.random() * (maxX - minX) + minX;
            randY = Math.random() * (maxY - minY) + minY;
          }
          
          // Final safety clamp
          randX = Math.max(margin, Math.min(canvasWidth - margin - dieSize, randX));
          randY = Math.max(margin, Math.min(canvasHeight - margin - dieSize, randY));
          
          const initialX = randX;
          const initialY = randY;

          const newDie: Die = {
            id: `${tier}-${Date.now()}-${Math.random()}`,
            tier: tier as any,
            x: initialX,
            y: initialY,
            desktopX: isMobile ? undefined : initialX,
            desktopY: isMobile ? undefined : initialY,
            mobileX: isMobile ? initialX : undefined,
            mobileY: isMobile ? initialY : undefined,
            currentFace: 1,
            isRolling: false,
            lastRollTime: 0,
          };

          set((state) => ({
            dice: [...state.dice, newDie],
            diceTiers: {
              ...state.diceTiers,
              [tier]: {
                ...state.diceTiers[tier],
                count: state.diceTiers[tier].count + 1,
              },
            },
          }));
        }
      },

      rollDie: (dieId: string, rolledNumber?: number) => {
        const state = get();
        const die = state.dice.find(d => d.id === dieId);
        if (!die) return 0;

        const now = Date.now();
        const cooldown = 300; // 300ms cooldown

        if (now - die.lastRollTime < cooldown) return 0;

        // Use provided rolled number if given; otherwise generate with Luck bias
        let finalRolledNumber: number;
        if (typeof rolledNumber === 'number' && rolledNumber >= 1 && rolledNumber <= 6) {
          finalRolledNumber = rolledNumber;
        } else {
          const biasToHigh = (state.purchasedSkills['LUCK-01'] ? 0.05 : 0) + (state.purchasedSkills['LUCK-02'] ? 0.10 : 0);
          if (Math.random() < biasToHigh) {
            // Bias to higher results 4,5,6
            const high = [4, 5, 6];
            finalRolledNumber = high[Math.floor(Math.random() * high.length)];
          } else {
            // Correct uniform 1..6
            finalRolledNumber = Math.floor(Math.random() * 6) + 1;
          }
        }
        // Base tier multiplier
        let tierMultiplier = state.diceTiers[die.tier].multiplier;

        // Additive honing from purchased Main skills
        // Sum multipliers for this die's tier
        const honingBonus = SKILL_DEFINITIONS
          .filter((def) => state.purchasedSkills[def.id])
          .filter((def) => def.effectType === 'tierMultiplier' && def.targetTier === die.tier)
          .reduce((sum, def) => sum + (def.multiplier || 0), 0);

        tierMultiplier += honingBonus;

        // Legacy upgrades
        let globalMultiplier = 1;
        if (state.upgrades.steelMultiplier && die.tier === 'steel') {
          globalMultiplier += state.upgrades.steelMultiplier.level * state.upgrades.steelMultiplier.effect;
        }
        if (state.upgrades.copperMultiplier && die.tier === 'copper') {
          globalMultiplier += state.upgrades.copperMultiplier.level * state.upgrades.copperMultiplier.effect;
        }
        if (state.upgrades.sixesBonus && state.upgrades.sixesBonus.level > 0 && finalRolledNumber === 6) {
          globalMultiplier *= state.upgrades.sixesBonus.effect;
        }

        // Overall income multiplier from Main skills (multiplicative on final gold)
        const overallIncomeAdditive = SKILL_DEFINITIONS
          .filter((def) => state.purchasedSkills[def.id])
          .filter((def) => def.effectType === 'globalIncome')
          .reduce((sum, def) => sum + (def.multiplier || 0), 0);

        const overallIncomeMultiplier = 1 + overallIncomeAdditive;

        // Sixes Sense: treat 6 as 7 sometimes for value calculation (not face)
        let baseRollValue = finalRolledNumber;
        if (finalRolledNumber === 6 && state.purchasedSkills['LUCK-04'] && Math.random() < 0.10) {
          baseRollValue = 7;
        }

        // Face Value branch adjustments on base value (before multipliers)
        if (state.purchasedSkills['FACE-02'] && finalRolledNumber === 2) {
          // Double 2 to 4
          baseRollValue = 4;
        }
        if (state.purchasedSkills['FACE-01'] && finalRolledNumber === 1) {
          // +2 flat to 1 before multipliers
          baseRollValue += 2;
        }
        if (state.purchasedSkills['FACE-03'] && (finalRolledNumber === 1 || finalRolledNumber === 2 || finalRolledNumber === 3)) {
          // +50% to low rolls base value
          baseRollValue = Math.max(0, baseRollValue * 1.5);
        }

        let goldEarned = Math.floor(baseRollValue * tierMultiplier * globalMultiplier * overallIncomeMultiplier);

        // High rolls bonus: +25% for 4/5/6
        if (state.purchasedSkills['FACE-04'] && (finalRolledNumber === 4 || finalRolledNumber === 5 || finalRolledNumber === 6)) {
          goldEarned = Math.floor(goldEarned * 1.25);
        }

        // Critical Hit: 1% chance to double final gold
        if (state.purchasedSkills['LUCK-03'] && Math.random() < 0.01) {
          goldEarned *= 2;
        }

        set((state) => ({
          dice: state.dice.map(d => 
            d.id === dieId 
              ? { ...d, currentFace: finalRolledNumber, isRolling: true, lastRollTime: now }
              : d
          ),
          gold: state.gold + goldEarned,
        }));

        // Stop rolling animation after animation duration (600ms)
        setTimeout(() => {
          set((state) => ({
            dice: state.dice.map(d => 
              d.id === dieId ? { ...d, isRolling: false } : d
            ),
          }));
        }, 600);
        
        return goldEarned;
      },

      updateDiePosition: (dieId: string, x: number, y: number) => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        set((state) => ({
          dice: state.dice.map(d => {
            if (d.id !== dieId) return d;
            return {
              ...d,
              x,
              y,
              desktopX: isMobile ? d.desktopX : x,
              desktopY: isMobile ? d.desktopY : y,
              mobileX: isMobile ? x : d.mobileX,
              mobileY: isMobile ? y : d.mobileY,
            };
          }),
        }));
      },

      purchaseUpgrade: (upgradeId: string) => {
        const state = get();
        const upgrade = state.upgrades[upgradeId];
        
        if (!upgrade || upgrade.level >= upgrade.maxLevel) return;
        if (!state.spendGold(upgrade.cost)) return;

        const newLevel = upgrade.level + 1;
        const newCost = Math.floor(upgrade.cost * 1.5);

        set((state) => ({
          upgrades: {
            ...state.upgrades,
            [upgradeId]: {
              ...upgrade,
              level: newLevel,
              cost: newCost,
            },
          },
        }));

        // Handle unlock logic
        if (upgradeId === 'unlockCopper') {
          set((state) => ({
            diceTiers: {
              ...state.diceTiers,
              copper: { ...state.diceTiers.copper, unlocked: true },
            },
          }));
        }
      },

      purchaseSkill: (skillId: string) => {
        const state = get();
        const def = SKILL_DEFINITIONS.find(s => s.id === skillId);
        if (!def) return;
        if (state.purchasedSkills[skillId]) return;
        // prerequisites
        const prereqsMet = def.prerequisites.every(p => state.purchasedSkills[p]);
        if (!prereqsMet) return;
        if (!state.spendGold(def.cost)) return;

        set((state) => ({
          purchasedSkills: { ...state.purchasedSkills, [skillId]: true },
        }));

        // Unlock tiers whose unlockedBy matches this skill id
        const tiersToUnlock = (Object.keys(TIER_DEFINITIONS) as TierKey[]).filter(
          (k) => TIER_DEFINITIONS[k].unlockedBy === skillId
        );
        if (tiersToUnlock.length > 0) {
          set((state) => {
            const updated: Record<string, DiceTier> = { ...state.diceTiers };
            tiersToUnlock.forEach((k) => {
              updated[k] = { ...updated[k], unlocked: true };
            });
            return { diceTiers: updated } as Partial<GameState> as any;
          });
        }
      },

      toggleSkillTree: () => {
        set((state) => ({ skillTreeOpen: !state.skillTreeOpen }));
      },

      resetGame: () => {
        set({
          gold: 100,
          dice: [],
          diceTiers: buildInitialDiceTiers(),
          upgrades: { ...SKILL_TREE },
          purchasedSkills: {},
          skillTreeOpen: false,
        });
      },
    }),
    {
      name: 'dice-tycoon-save',
      partialize: (state) => ({
        gold: state.gold,
        dice: state.dice,
        diceTiers: state.diceTiers,
        upgrades: state.upgrades,
        purchasedSkills: state.purchasedSkills,
      }),
    }
  )
);
