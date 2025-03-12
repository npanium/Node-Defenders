// Base message type
export interface ClientMessage {
  type: string;
  [key: string]: any;
}

// Position interface for node placement
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Node statistics data
export interface NodeStatsData {
  damage: number;
  range: number;
  speed: number;
  efficiency: number;
}

// Node health data
export interface NodeHealthData {
  currentHealth: number;
  maxHealth: number;
  healthPercentage: number;
  lastUpdated: Date;
}

// Node information
export interface NodeInfo {
  id: string;
  type: string;
  position: Position;
  createdAt: Date;
  stats: NodeStatsData;
  health?: NodeHealthData;
}

// Game state
export interface GameState {
  totalNodesPlaced: number;
  nodeTypes: { [key: string]: number };
  nodes: { [key: string]: NodeInfo };
  lastUpdated: Date;
  enemiesInWave: number;
  enemiesKilled: number;
  isCountingDown: boolean;
  currency: number;
  selectedNodeId: string | null;
  currentWave: number;
  nextWaveCountdown: number;
  maxWaves: number;
  mainNodeHealth: NodeHealthData;
}

// State update message
export interface StateUpdateMessage {
  type: string;
  data: GameState;
}

// Action confirmation message
export interface ActionConfirmedMessage {
  type: string;
  action: string;
  success: boolean;
  newTotal?: number;
  nodeId?: string;
  message?: string;
}

// Node placement message
export interface NodePlacedMessage extends ClientMessage {
  nodeType: string;
  position?: Position;
  stats?: NodeStatsData;
  nodeId?: string;
  timestamp?: string;
}

// Node selection message
export interface NodeSelectedMessage extends ClientMessage {
  nodeId: string;
}

// Node destruction message
export interface NodeDestroyedMessage extends ClientMessage {
  nodeType?: string;
  nodeId?: string;
  timestamp?: string;
}

// Node stats update message
export interface NodeStatsUpdateMessage extends ClientMessage {
  nodeId: string;
  stats: NodeStatsData;
  level?: number;
}

// Node health update message
export interface NodeHealthUpdateMessage extends ClientMessage {
  nodeId: string;
  currentHealth: number;
  maxHealth: number;
  healthPercentage: number;
  timestamp?: string;
}

// Game over message
export interface GameOverMessage extends ClientMessage {
  cause: string;
  timestamp?: string;
}

// UI action message for healing
export interface HealNodeMessage extends ClientMessage {
  action: string;
  payload: {
    nodeId: string;
    amount: number;
  };
}
