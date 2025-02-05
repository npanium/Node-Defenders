import { GameConfig, Tower, Position } from "../types/core";
import { GameState } from "../types/gameState";

export class GameEngine {
  private config: GameConfig;
  private towers: Map<string, Tower>;
  private resources: number;
  private health: number;
  private wave: number;
  private subscribers: Set<(state: GameState) => void>;

  constructor(config: GameConfig) {
    this.config = config;
    this.towers = new Map();
    this.resources = config.initialResources;
    this.health = config.baseHealth;
    this.wave = 1;
    this.subscribers = new Set();
  }

  // Game state management
  public getState(): GameState {
    return {
      towers: Array.from(this.towers.values()),
      resources: this.resources,
      health: this.health,
      wave: this.wave,
    };
  }

  // Tower management
  public placeTower(type: Tower["type"], position: Position): Tower | null {
    // Check resources and position validity
    // Create and place tower
    // Update state
    // Return new tower or null if invalid
  }

  public upgradeTower(towerId: string): boolean {
    // Upgrade logic
    // Update state
    // Return success status
  }

  // Wave management
  public startWave(): void {
    // Wave logic
    // Update state
  }

  // DeFi interactions
  public harvestYield(towerId: string): number {
    // Calculate and distribute yield
    // Update state
    // Return harvested amount
  }

  // State subscription system
  public subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach((callback) => callback(state));
  }
}
