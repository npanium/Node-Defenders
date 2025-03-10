export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface NodeStats {
  damage: number;
  range: number;
  speed: number;
  efficiency: number;
}

export interface LiquidityPool {
  id: string;
  type: string;
  amount: number;
  returns: string;
}

export interface NodeInfo {
  id: string;
  type: string;
  position: Position;
  createdAt: Date;
  stats: NodeStats;
}

export interface GameState {
  // Original fields
  currency: number;
  score: number;
  enemiesKilled: number;
  turretsPlaced: number;
  liquidityPools: LiquidityPool[];

  // New fields for node tracking
  totalNodesPlaced: number;
  nodeTypes: Record<string, number>;
  lastUpdated: Date;
  nodes: Record<string, NodeInfo>;
  selectedNodeId: string | null;
}

export interface UnityEventPayload {
  points?: number;
  currency?: number;
  cost?: number;
  createPool?: boolean;
  turretType?: string;
  poolAmount?: number;
  returns?: string;
  amount?: number;
  nodeId?: string;
  nodeType?: string;
  position?: Position;
  stats?: NodeStats;
  [key: string]: any;
}

// Base message interface
interface BaseMessage {
  type: string;
}

// Message type definitions for WebSocket communication
export interface NodePlacedMessage extends BaseMessage {
  type: "node_placed";
  nodeType: string;
  nodeId?: string;
  position?: Position;
  stats?: NodeStats;
  timestamp?: string;
}

export interface NodeDestroyedMessage extends BaseMessage {
  type: "node_destroyed";
  nodeType?: string;
  nodeId?: string;
  timestamp?: string;
}

export interface NodeSelectedMessage extends BaseMessage {
  type: "node_selected";
  nodeId: string;
}

export interface NodeStatsUpdateMessage extends BaseMessage {
  type: "node_stats_update";
  nodeId: string;
  stats: NodeStats;
  level?: number;
}

export interface UIActionMessage extends BaseMessage {
  type: "ui_action";
  action: string;
  payload: Record<string, any>;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

export interface StateUpdateMessage extends BaseMessage {
  type: "state_update";
  data: GameState;
}

export interface ActionConfirmedMessage extends BaseMessage {
  type: "action_confirmed";
  action: string;
  success: boolean;
  newTotal?: number;
  nodeId?: string;
}

// Type for client messages
export type ClientMessage =
  | NodePlacedMessage
  | NodeDestroyedMessage
  | NodeSelectedMessage
  | NodeStatsUpdateMessage
  | UIActionMessage
  | TextMessage;

// Type for server messages
export type ServerMessage =
  | StateUpdateMessage
  | ActionConfirmedMessage
  | NodeStatsUpdateMessage;

// Socket.IO event interfaces
// Note: These are reversed from the server since we're on the client
export interface ServerToClientEvents {
  game_state_update: (state: GameState) => void;
  ui_to_unity: (data: { action: string; payload: Record<string, any> }) => void;
}

export interface ClientToServerEvents {
  join_game: (gameId: string) => void;
  unity_event: (data: {
    gameId: string;
    eventType: string;
    payload: UnityEventPayload;
  }) => void;
  ui_action: (data: {
    gameId: string;
    action: string;
    payload: Record<string, any>;
  }) => void;
}
