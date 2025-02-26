export interface LiquidityPool {
  id: string;
  type: string;
  amount: number;
  returns: string;
}

export interface GameState {
  currency: number;
  score: number;
  enemiesKilled: number;
  turretsPlaced: number;
  liquidityPools: LiquidityPool[];
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
  [key: string]: any;
}

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
