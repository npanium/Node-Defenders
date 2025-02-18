import { Tower } from "./core";

export interface GameState {
  // Core game state
  towers: Tower[];
  resources: number;
  health: number;
  wave: number;
  isWaveActive: boolean;
  waveStartTime?: number;

  // DeFi state
  totalValueLocked: number;
  totalYieldGenerated: number;
  unclaimedYield: number;

  // Player state
  playerAddress?: string;
  playerLevel: number;
  experience: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: number;
}

export interface GameStateUpdate {
  type: GameStateUpdateType;
  payload: Partial<GameState>;
  timestamp: number;
}

export type GameStateUpdateType =
  | "TOWER_PLACED"
  | "TOWER_UPGRADED"
  | "WAVE_START"
  | "WAVE_END"
  | "YIELD_CLAIMED"
  | "RESOURCES_UPDATED"
  | "HEALTH_CHANGED"
  | "ACHIEVEMENT_UNLOCKED";
