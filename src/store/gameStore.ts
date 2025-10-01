import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Die {
  id: string;
  tier: 'steel' | 'copper' | 'silver' | 'gold' | 'emerald';
  x: number;
  y: number;
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
  
  // UI state
  skillTreeOpen: boolean;
  
  // Actions
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  spawnDie: (tier: string) => void;
  rollDie: (dieId: string) => void;
  updateDiePosition: (dieId: string, x: number, y: number) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  toggleSkillTree: () => void;
  resetGame: () => void;
}

// Dice tier configurations
const DICE_TIERS: Record<string, DiceTier> = {
  steel: {
    name: 'Steel',
    baseCost: 10,
    multiplier: 1,
    unlocked: true,
    count: 0,
  },
  copper: {
    name: 'Copper',
    baseCost: 100,
    multiplier: 5,
    unlocked: false,
    count: 0,
  },
  silver: {
    name: 'Silver',
    baseCost: 1000,
    multiplier: 25,
    unlocked: false,
    count: 0,
  },
  gold: {
    name: 'Gold',
    baseCost: 25000,
    multiplier: 150,
    unlocked: false,
    count: 0,
  },
  emerald: {
    name: 'Emerald',
    baseCost: 500000,
    multiplier: 1000,
    unlocked: false,
    count: 0,
  },
};

// Skill tree configuration
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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      gold: 100,
      dice: [],
      diceTiers: { ...DICE_TIERS },
      upgrades: { ...SKILL_TREE },
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
          const newDie: Die = {
            id: `${tier}-${Date.now()}-${Math.random()}`,
            tier: tier as any,
            x: Math.random() * 600 + 50, // Random position in canvas
            y: Math.random() * 400 + 50,
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

      rollDie: (dieId: string) => {
        const state = get();
        const die = state.dice.find(d => d.id === dieId);
        if (!die) return;

        const now = Date.now();
        const cooldown = 300; // 300ms cooldown

        if (now - die.lastRollTime < cooldown) return;

        // Calculate gold earned
        const rolledNumber = Math.floor(Math.random() * 6) + 1;
        const tierMultiplier = state.diceTiers[die.tier].multiplier;
        
        // Apply upgrades
        let globalMultiplier = 1;
        if (state.upgrades.steelMultiplier && die.tier === 'steel') {
          globalMultiplier += state.upgrades.steelMultiplier.level * state.upgrades.steelMultiplier.effect;
        }
        if (state.upgrades.copperMultiplier && die.tier === 'copper') {
          globalMultiplier += state.upgrades.copperMultiplier.level * state.upgrades.copperMultiplier.effect;
        }
        if (state.upgrades.sixesBonus && state.upgrades.sixesBonus.level > 0 && rolledNumber === 6) {
          globalMultiplier *= state.upgrades.sixesBonus.effect;
        }

        const goldEarned = Math.floor(rolledNumber * tierMultiplier * globalMultiplier);

        set((state) => ({
          dice: state.dice.map(d => 
            d.id === dieId 
              ? { ...d, currentFace: rolledNumber, isRolling: true, lastRollTime: now }
              : d
          ),
          gold: state.gold + goldEarned,
        }));

        // Stop rolling animation after a short delay
        setTimeout(() => {
          set((state) => ({
            dice: state.dice.map(d => 
              d.id === dieId ? { ...d, isRolling: false } : d
            ),
          }));
        }, 200);
      },

      updateDiePosition: (dieId: string, x: number, y: number) => {
        set((state) => ({
          dice: state.dice.map(d => 
            d.id === dieId ? { ...d, x, y } : d
          ),
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

      toggleSkillTree: () => {
        set((state) => ({ skillTreeOpen: !state.skillTreeOpen }));
      },

      resetGame: () => {
        set({
          gold: 100,
          dice: [],
          diceTiers: { ...DICE_TIERS },
          upgrades: { ...SKILL_TREE },
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
      }),
    }
  )
);
