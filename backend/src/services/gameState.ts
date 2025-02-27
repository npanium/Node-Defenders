// import { GameState } from "../types/socket";

// // In-memory game state storage
// // To be replaced with a database
// class GameStateService {
//   private gameStates: Record<string, GameState> = {};

//   getGameState(gameId: string): GameState {
//     // Return existing game state or create a new one
//     if (!this.gameStates[gameId]) {
//       this.gameStates[gameId] = {
//         currency: 100,
//         score: 0,
//         enemiesKilled: 0,
//         turretsPlaced: 0,
//         liquidityPools: [],
//       };
//     }

//     return this.gameStates[gameId];
//   }

//   updateGameState(gameId: string, updatedState: Partial<GameState>): GameState {
//     const currentState = this.getGameState(gameId);

//     // Update with the new state
//     this.gameStates[gameId] = {
//       ...currentState,
//       ...updatedState,
//     };

//     return this.gameStates[gameId];
//   }

//   // Helper method to add a liquidity pool
//   addLiquidityPool(
//     gameId: string,
//     type: string,
//     amount: number,
//     returns: string = "2.5%"
//   ): GameState {
//     const state = this.getGameState(gameId);

//     state.liquidityPools.push({
//       id: `pool-${Date.now()}`,
//       type,
//       amount,
//       returns,
//     });

//     return state;
//   }
// }

// // Export as a singleton
// export const gameStateService = new GameStateService();
