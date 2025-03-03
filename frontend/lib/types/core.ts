export interface Position {
  x: number;
  y: number;
}

export interface GameConfig {
  gridSize: number;
  baseHealth: number;
  initialResources: number;
  waveDuration: number;
}

export interface TowerBase {
  id: string;
  position: Position;
  level: number;
  yieldPerHour: number;
  lastHarvest: number;
}

export interface ValidatorTower extends TowerBase {
  type: "validator";
  stakingAmount: number;
  apr: number;
}

export interface LPTower extends TowerBase {
  type: "lp";
  tokenPairId: string;
  liquidityProvided: number;
}

export interface LendingTower extends TowerBase {
  type: "lending";
  lendingPoolId: string;
  interestRate: number;
}

export interface YieldTower extends TowerBase {
  type: "yield";
  strategy: string;
  autoCompoundRate: number;
}

export type Tower = ValidatorTower | LPTower | LendingTower | YieldTower;

export interface GameData {
  address: string;
  score: number;
  // verified: boolean;
  // bets: number;
}
