export type SkillBranch = 'Main' | 'Luck' | 'Automation' | 'Face Value';

export interface SkillDefinition {
  id: string; // e.g., MAIN-01
  name: string;
  branch: SkillBranch;
  description: string;
  effect: string; // human text
  cost: number; // in SP/Gold for now we use Gold currency
  prerequisites: string[]; // ids
}

// Modeled from "Dice Tycoon - Skill Tier.csv"
export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { id: 'MAIN-01', name: 'Steel Honing I', branch: 'Main', description: 'Sharpen the edges of your Steel die for slightly better returns.', effect: 'Increases Steel Die multiplier by +0.1x.', cost: 15, prerequisites: [] },
  { id: 'MAIN-02', name: 'Steel Honing II', branch: 'Main', description: 'Further refinements to the Steel die.', effect: 'Increases Steel Die multiplier by another +0.15x.', cost: 40, prerequisites: ['MAIN-01'] },
  { id: 'MAIN-03', name: 'Unlock: Copper Die', branch: 'Main', description: 'Unlocks the ability to purchase the Copper Die from the shop.', effect: 'Copper Die becomes available.', cost: 100, prerequisites: ['MAIN-02'] },
  { id: 'MAIN-04', name: 'Copper Honing I', branch: 'Main', description: 'Further refinements to the Copper Die.', effect: 'Increase the Multiplier by +0.5x', cost: 200, prerequisites: ['MAIN-03'] },
  { id: 'MAIN-05', name: 'Copper Honing II', branch: 'Main', description: 'Advanced techniques for the Copper Die.', effect: 'Increases Copper Die multiplier by another +0.75x.', cost: 350, prerequisites: ['MAIN-04'] },
  { id: 'MAIN-06', name: 'Overall Income I', branch: 'Main', description: 'Foundational knowledge of earnings. Increases all Gold gained.', effect: '+5% overall income multiplier.', cost: 500, prerequisites: ['MAIN-05'] },
  { id: 'MAIN-07', name: 'Unlock: Silver Die', branch: 'Main', description: 'Unlocks the ability to purchase the Silver Die from the shop.', effect: 'Silver Die becomes available.', cost: 800, prerequisites: ['MAIN-06'] },
  { id: 'MAIN-08', name: 'Silver Honing I', branch: 'Main', description: 'Polish the Silver Die to a brilliant shine.', effect: 'Increases Silver Die multiplier by +1x.', cost: 1200, prerequisites: ['MAIN-07'] },
  { id: 'MAIN-09', name: 'Silver Honing II', branch: 'Main', description: 'Engrave the Silver Die with patterns of power.', effect: 'Increases Silver Die multiplier by another +1.5x.', cost: 2000, prerequisites: ['MAIN-08'] },
  { id: 'MAIN-10', name: 'Unlock: Gold Die', branch: 'Main', description: 'Unlocks the ability to purchase the Gold Die from the shop.', effect: 'Gold Die becomes available.', cost: 3500, prerequisites: ['MAIN-09'] },
  { id: 'MAIN-11', name: 'Gold Honing I', branch: 'Main', description: 'Refine the Gold Die, making it heavier and mightier.', effect: 'Increases Gold Die multiplier by +2x.', cost: 5000, prerequisites: ['MAIN-10'] },
  { id: 'MAIN-12', name: 'Overall Income II', branch: 'Main', description: 'Advanced economic theories. Increases all Gold gained.', effect: '+10% overall income multiplier.', cost: 8000, prerequisites: ['MAIN-11'] },
  { id: 'MAIN-13', name: 'Gold Honing II', branch: 'Main', description: 'Imbue the Gold Die with an aura of wealth.', effect: 'Increases Gold Die multiplier by another +3x.', cost: 12000, prerequisites: ['MAIN-12'] },
  { id: 'MAIN-14', name: 'Unlock: Emerald Die', branch: 'Main', description: 'Unlocks the ability to purchase the Emerald Die from the shop.', effect: 'Emerald Die becomes available.', cost: 20000, prerequisites: ['MAIN-13'] },
  { id: 'MAIN-15', name: 'Emerald Honing I', branch: 'Main', description: 'Cut facets into the Emerald Die to catch the light of fortune.', effect: 'Increases Emerald Die multiplier by +5x.', cost: 30000, prerequisites: ['MAIN-14'] },
  { id: 'MAIN-16', name: 'Emerald Honing II', branch: 'Main', description: 'The Emerald Die now hums with latent energy.', effect: 'Increases Emerald Die multiplier by another +5x.', cost: 50000, prerequisites: ['MAIN-15'] },
  { id: 'MAIN-17', name: 'Unlock: Platinum Die', branch: 'Main', description: 'Unlocks the ability to purchase the Platinum Die from the shop.', effect: 'Platinum Die becomes available.', cost: 80000, prerequisites: ['MAIN-16'] },
  { id: 'MAIN-18', name: 'Platinum Honing I', branch: 'Main', description: 'The sheer density of the Platinum Die improves its impact.', effect: 'Increases Platinum Die multiplier by +10x.', cost: 120000, prerequisites: ['MAIN-17'] },
  { id: 'MAIN-19', name: 'Unlock: Diamond Die', branch: 'Main', description: 'Unlocks the ability to purchase the Diamond Die from the shop.', effect: 'Diamond Die becomes available.', cost: 200000, prerequisites: ['MAIN-18'] },
  { id: 'MAIN-20', name: 'Diamond Honing I', branch: 'Main', description: 'A flawless Diamond Die, perfectly balanced for maximum returns.', effect: 'Increases Diamond Die multiplier by +25x.', cost: 350000, prerequisites: ['MAIN-19'] },
  { id: 'MAIN-21', name: 'Overall Income III', branch: 'Main', description: 'Mastery of the market. Increases all Gold gained significantly.', effect: '+15% overall income multiplier.', cost: 500000, prerequisites: ['MAIN-20'] },
  { id: 'MAIN-22', name: 'Unlock: Ruby Die', branch: 'Main', description: 'Unlocks the ability to purchase the Ruby Die from the shop.', effect: 'Ruby Die becomes available.', cost: 800000, prerequisites: ['MAIN-21'] },
  { id: 'MAIN-23', name: 'Ruby Honing I', branch: 'Main', description: 'The inner fire of the Ruby Die burns brighter, yielding more gold.', effect: 'Increases Ruby Die multiplier by +50x.', cost: 1200000, prerequisites: ['MAIN-22'] },
  { id: 'MAIN-24', name: 'Unlock: Obsidian Die', branch: 'Main', description: 'Unlocks the ability to purchase the Obsidian Die from the shop.', effect: 'Obsidian Die becomes available.', cost: 2000000, prerequisites: ['MAIN-23'] },
  { id: 'MAIN-25', name: 'Obsidian Honing I', branch: 'Main', description: 'The volcanic glass of the Obsidian Die is razor-sharp.', effect: 'Increases Obsidian Die multiplier by +100x.', cost: 5000000, prerequisites: ['MAIN-24'] },

  { id: 'LUCK-01', name: "Beginner's Luck", branch: 'Luck', description: 'You start to feel a bit luckier. The die seems to favor higher numbers.', effect: '+5% chance to roll a 4, 5, or 6.', cost: 50, prerequisites: ['MAIN-01'] },
  { id: 'LUCK-02', name: 'Lucky Roll', branch: 'Luck', description: 'Your control over the die improves, making high rolls more common.', effect: '+10% chance to roll a 4, 5, or 6.', cost: 150, prerequisites: ['LUCK-01'] },
  { id: 'LUCK-03', name: 'Critical Hit', branch: 'Luck', description: 'A small chance that your roll is supercharged, yielding double the result.', effect: '1% chance to double final Gold from a roll.', cost: 400, prerequisites: ['LUCK-02'] },
  { id: 'LUCK-04', name: 'Sixes Sense', branch: 'Luck', description: 'You have a knack for rolling the highest number.', effect: 'Rolling a 6 has a 10% chance to be treated as a 7.', cost: 750, prerequisites: ['LUCK-03'] },

  { id: 'AUTO-01', name: 'Hover to Roll', branch: 'Automation', description: 'Your mere presence is enough to move the die. Roll by hovering.', effect: 'Enables rolling by hovering the mouse over the die.', cost: 75, prerequisites: ['MAIN-01'] },
  { id: 'AUTO-02', name: 'Wider Influence', branch: 'Automation', description: 'Your hover-to-roll aura expands, making it easier to activate.', effect: 'Increases the hover activation area by 30%.', cost: 120, prerequisites: ['AUTO-01'] },
  { id: 'AUTO-03', name: 'Auto-Roller Mk I', branch: 'Automation', description: 'The die develops a mind of its own, rolling automatically.', effect: 'Automatically rolls the die once every 10 seconds.', cost: 300, prerequisites: ['AUTO-02'] },
  { id: 'AUTO-04', name: 'Auto-Roller Mk II', branch: 'Automation', description: 'The auto-roller becomes faster and more efficient.', effect: 'Reduces auto-roll time to once every 5 seconds.', cost: 800, prerequisites: ['AUTO-03'] },

  { id: 'FACE-01', name: 'Weighted Ones', branch: 'Face Value', description: 'Even a roll of 1 provides a small bonus.', effect: 'Rolls of 1 grant +2 flat Gold before multipliers.', cost: 60, prerequisites: ['MAIN-02'] },
  { id: 'FACE-02', name: 'Double Down', branch: 'Face Value', description: 'Rolling a 2 now feels more rewarding.', effect: 'Rolls of 2 have their base value doubled to 4.', cost: 120, prerequisites: ['FACE-01'] },
  { id: 'FACE-03', name: "Low Roller's Boon", branch: 'Face Value', description: 'Master the art of low rolls. All low numbers are more valuable.', effect: 'Increases base Gold from rolls of 1, 2, and 3 by 50%.', cost: 350, prerequisites: ['FACE-02'] },
  { id: 'FACE-04', name: "High Roller's Reward", branch: 'Face Value', description: 'Live for the big numbers. High rolls now pay a premium.', effect: 'Rolls of 4, 5, and 6 grant a +25% Gold bonus.', cost: 600, prerequisites: ['MAIN-06'] },
];


