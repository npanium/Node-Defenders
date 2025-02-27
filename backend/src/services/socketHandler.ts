// import { Server, Socket } from "socket.io";
// import {
//   ClientToServerEvents,
//   ServerToClientEvents,
//   InterServerEvents,
//   SocketData,
//   UnityEventPayload,
// } from "../types/socket";

// type IoServer = Server<
//   ClientToServerEvents,
//   ServerToClientEvents,
//   InterServerEvents,
//   SocketData
// >;

// type IoSocket = Socket<
//   ClientToServerEvents,
//   ServerToClientEvents,
//   InterServerEvents,
//   SocketData
// >;

// // In-memory game state storage (simplified for testing)
// interface GameState {
//   currency: number;
//   score: number;
//   enemiesKilled: number;
//   turretsPlaced: number;
//   liquidityPools: LiquidityPool[];
// }

// interface LiquidityPool {
//   id: string;
//   type: string;
//   amount: number;
//   returns: string;
// }

// const gameStates: Record<string, GameState> = {};

// export function setupSocketHandlers(io: IoServer) {
//   io.engine.on("connection", (socket) => {
//     console.log("Raw Socket.IO connection established:", socket.id);
//   });

//   io.engine.on("close", (socket) => {
//     console.log("Raw Socket.IO connection closed:", socket.id);
//   });

//   io.on("connection", (socket: IoSocket) => {
//     console.log("Client connected:", socket.id);

//     socket.on("join_game", (gameId) => {
//       socket.join(gameId);
//       socket.data.gameId = gameId;
//       console.log(`Client ${socket.id} joined game ${gameId}`);

//       if (!gameStates[gameId]) {
//         gameStates[gameId] = {
//           currency: 100,
//           score: 0,
//           enemiesKilled: 0,
//           turretsPlaced: 0,
//           liquidityPools: [],
//         };
//       }

//       socket.emit("game_state_update", gameStates[gameId]);
//     });

//     socket.on("unity_event", (data) => {
//       const { gameId, eventType, payload } = data;
//       console.log(
//         `Game event received: ${eventType} for game ${gameId}`,
//         payload
//       );

//       if (!gameStates[gameId]) {
//         gameStates[gameId] = {
//           currency: 100,
//           score: 0,
//           enemiesKilled: 0,
//           turretsPlaced: 0,
//           liquidityPools: [],
//         };
//       }

//       const state = gameStates[gameId];

//       switch (eventType) {
//         case "currency_update":
//           if (typeof payload.amount === "number") {
//             state.currency = payload.amount;
//             console.log(
//               `Currency updated to ${state.currency} for game ${gameId}`
//             );
//           }
//           break;

//         case "turret_placed":
//           state.turretsPlaced++;

//           if (typeof payload.cost === "number") {
//             console.log(
//               `Turret placed, cost: ${payload.cost}, new total: ${state.turretsPlaced}`
//             );
//           }

//           if (payload.createPool) {
//             const newPool: LiquidityPool = {
//               id: `pool-${Date.now()}`,
//               type: payload.turretType || "standard",
//               amount: payload.poolAmount || 100,
//               returns: payload.returns || "2.5%",
//             };

//             state.liquidityPools.push(newPool);
//             console.log(`New liquidity pool created for ${newPool.type}`);
//           }
//           break;

//         default:
//           console.log(`Unhandled event type: ${eventType}`);
//       }

//       // Save state and broadcast to all clients in the room
//       gameStates[gameId] = state;
//       io.to(gameId).emit("game_state_update", state);
//     });

//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//     });
//   });
// }
