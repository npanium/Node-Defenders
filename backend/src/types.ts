export interface NodeTypes {
  [key: string]: number;
}

export interface GameState {
  totalNodesPlaced: number;
  nodeTypes: NodeTypes;
  lastUpdated: Date;
}

export interface BaseMessage {
  type: string;
}

export interface NodePlacedMessage extends BaseMessage {
  type: "node_placed";
  nodeType: string;
  timestamp?: string;
}

export interface NodeDestroyedMessage extends BaseMessage {
  type: "node_destroyed";
  nodeType: string;
  timestamp?: string;
}

export interface StateUpdateMessage extends BaseMessage {
  type: "state_update";
  data: GameState;
}

export interface ActionConfirmedMessage extends BaseMessage {
  type: "action_confirmed";
  action: string;
  success: boolean;
  newTotal: number;
}

export type ServerMessage = StateUpdateMessage | ActionConfirmedMessage;
export type ClientMessage =
  | NodePlacedMessage
  | NodeDestroyedMessage
  | { type: "text"; content: string };
