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

    // Notify initial state
    this.notifySubscribers();
  }

  // Game state management
  public getState(): GameState {
    return {
      towers: Array.from(this.towers.values()),
      resources: this.resources,
      health: this.health,
      wave: this.wave,
      isWaveActive: false,
      playerLevel: 1,
      experience: 0,
      achievements: [],
      totalValueLocked: this.calculateTVL(),
      totalYieldGenerated: 0,
      unclaimedYield: 0,
    };
  }

  private calculateTVL(): number {
    return Array.from(this.towers.values()).reduce(
      (sum, tower) => sum + tower.yieldPerHour,
      0
    );
  }

  // Tower management
  public placeTower(type: Tower["type"], position: Position): Tower | null {
    // Check if position is occupied
    const posKey = `${position.x},${position.y}`;
    if (
      Array.from(this.towers.values()).some(
        (t) => t.position.x === position.x && t.position.y === position.y
      )
    ) {
      return null;
    }

    // Check resources
    const cost = 100; // Base cost
    if (this.resources < cost) {
      return null;
    }

    // Create tower
    const tower: Tower = {
      id: `tower-${Date.now()}`,
      type,
      position,
      level: 1,
      yieldPerHour: 10,
      lastHarvest: Date.now(),
      stakingAmount: type === "validator" ? cost : 0,
      apr: type === "validator" ? 5 : 0,
      tokenPairId: type === "lp" ? "eth-usdc" : "",
      liquidityProvided: type === "lp" ? cost : 0,
      lendingPoolId: type === "lending" ? "main" : "",
      interestRate: type === "lending" ? 3 : 0,
      strategy: type === "yield" ? "compound" : "",
      autoCompoundRate: type === "yield" ? 1 : 0,
    } as Tower;

    // Update state
    this.towers.set(tower.id, tower);
    this.resources -= cost;
    this.notifySubscribers();

    return tower;
  }

  public upgradeTower(towerId: string): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) return false;

    const upgradeCost = tower.level * 150;
    if (this.resources < upgradeCost) return false;

    // Update tower stats
    const updatedTower = {
      ...tower,
      level: tower.level + 1,
      yieldPerHour: tower.yieldPerHour * 1.5,
    };

    this.towers.set(towerId, updatedTower);
    this.resources -= upgradeCost;
    this.notifySubscribers();
    return true;
  }

  // Wave management
  public startWave(): void {
    // Wave logic
    // Update state
  }

  // DeFi interactions
  public harvestYield(towerId: string): number {
    const tower = this.towers.get(towerId);
    if (!tower) return 0;

    const timeElapsed = (Date.now() - tower.lastHarvest) / 3600000; // hours
    const yieldGen = tower.yieldPerHour * timeElapsed;

    const updatedTower = {
      ...tower,
      lastHarvest: Date.now(),
    };

    this.towers.set(towerId, updatedTower);
    this.resources += yieldGen;
    this.notifySubscribers();
    return yieldGen;
  }

  // State subscription system
  public subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    // console.log("Notifying subscribers with state:", state); // Debug log
    this.subscribers.forEach((callback) => callback(state));
  }
}
