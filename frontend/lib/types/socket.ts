// Define common types for WebSocket communication

// Base message type for outgoing messages
export interface ClientMessage {
  type: string;
  [key: string]: any;
}

// Position interface
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

// Liquidity Pool information
export interface LiquidityPool {
  id: string;
  name: string;
  balance: number;
  apy: number;
}

// Game state
export interface GameState {
  currency: number;
  score: number;
  enemiesKilled: number;
  turretsPlaced: number;
  liquidityPools: LiquidityPool[];
  totalNodesPlaced: number | undefined;
  nodeTypes: { [key: string]: number };
  nodes: { [key: string]: NodeInfo };
  lastUpdated: Date;
  selectedNodeId: string | null;
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

// UI action message
export interface UIActionMessage extends ClientMessage {
  action: string;
  payload: Record<string, any>;
}
