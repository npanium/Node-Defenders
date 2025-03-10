// Enhanced types.ts

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface NodeStatsData {
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
  stats: NodeStatsData;
}

export interface GameState {
  // Original game state properties
  currency?: number;
  score?: number;
  enemiesKilled?: number;
  turretsPlaced?: number;
  liquidityPools?: LiquidityPool[];

  // Node tracking properties
  totalNodesPlaced: number;
  nodeTypes: Record<string, number>;
  lastUpdated: Date;
  nodes: Record<string, NodeInfo>; // Map node IDs to node objects
  selectedNodeId: string | null; // Currently selected node
}

// Base message interface
interface BaseMessage {
  type: string;
}

// Message for node placement
export interface NodePlacedMessage extends BaseMessage {
  type: "node_placed";
  nodeType: string;
  nodeId?: string;
  position?: Position;
  stats?: NodeStatsData;
  timestamp?: string;
}

// Message for node destruction
export interface NodeDestroyedMessage extends BaseMessage {
  type: "node_destroyed";
  nodeType?: string;
  nodeId?: string;
  timestamp?: string;
}

// Message for node selection
export interface NodeSelectedMessage extends BaseMessage {
  type: "node_selected";
  nodeId: string;
}

// Message for node stats update
export interface NodeStatsUpdateMessage extends BaseMessage {
  type: "node_stats_update";
  nodeId: string;
  stats: NodeStatsData;
  level?: number;
}

// Message for UI actions
export interface UIActionMessage extends BaseMessage {
  type: "ui_action";
  action: string;
  payload: Record<string, any>;
}

// Plain text message
export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

// Game state update message
export interface StateUpdateMessage extends BaseMessage {
  type: "state_update";
  data: GameState;
}

// Action confirmation message
export interface ActionConfirmedMessage extends BaseMessage {
  type: "action_confirmed";
  action: string;
  success: boolean;
  newTotal?: number;
  nodeId?: string;
}

// Union type for client messages
export type ClientMessage =
  | NodePlacedMessage
  | NodeDestroyedMessage
  | NodeSelectedMessage
  | NodeStatsUpdateMessage
  | UIActionMessage
  | TextMessage;

// Union type for server messages
export type ServerMessage =
  | StateUpdateMessage
  | ActionConfirmedMessage
  | NodeStatsUpdateMessage;

// Socket event interfaces
export interface ServerToClientEvents {
  game_state_update: (state: GameState) => void;
  ui_to_unity: (data: { action: string; payload: Record<string, any> }) => void;
}

export interface ClientToServerEvents {
  join_game: (gameId: string) => void;
  unity_event: (data: {
    gameId: string;
    eventType: string;
    payload: Record<string, any>;
  }) => void;
  ui_action: (data: {
    gameId: string;
    action: string;
    payload: Record<string, any>;
  }) => void;
}
