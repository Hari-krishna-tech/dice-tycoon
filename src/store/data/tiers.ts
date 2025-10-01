export type TierKey =
  | 'steel'
  | 'copper'
  | 'silver'
  | 'gold'
  | 'emerald'
  | 'platinum'
  | 'diamond'
  | 'ruby'
  | 'obsidian';

export interface TierDefinition {
  key: TierKey;
  name: string;
  baseCost: number;
  multiplier: number;
  unlockedBy: 'start' | string; // 'start' or skill id
}

export const TIER_DEFINITIONS: Record<TierKey, TierDefinition> = {
  steel: { key: 'steel', name: 'Steel', baseCost: 10, multiplier: 1, unlockedBy: 'start' },
  copper: { key: 'copper', name: 'Copper', baseCost: 50, multiplier: 1.5, unlockedBy: 'MAIN-03' },
  silver: { key: 'silver', name: 'Silver', baseCost: 100, multiplier: 3, unlockedBy: 'MAIN-07' },
  gold: { key: 'gold', name: 'Gold', baseCost: 250, multiplier: 5, unlockedBy: 'MAIN-10' },
  emerald: { key: 'emerald', name: 'Emerald', baseCost: 1000, multiplier: 10, unlockedBy: 'MAIN-14' },
  platinum: { key: 'platinum', name: 'Platinum', baseCost: 5000, multiplier: 20, unlockedBy: 'MAIN-17' },
  diamond: { key: 'diamond', name: 'Diamond', baseCost: 25000, multiplier: 50, unlockedBy: 'MAIN-20' },
  ruby: { key: 'ruby', name: 'Ruby', baseCost: 100000, multiplier: 100, unlockedBy: 'MAIN-22' },
  obsidian: { key: 'obsidian', name: 'Obsidian', baseCost: 500000, multiplier: 200, unlockedBy: 'MAIN-24' },
};


