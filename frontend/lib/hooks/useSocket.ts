import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
} from "../types/socket";

export default function useSocket(gameId: string = "player1") {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currency: 0,
    score: 0,
    enemiesKilled: 0,
    turretsPlaced: 0,
    liquidityPools: [],
  });

  // Initialize socket connection
  useEffect(() => {
    // Socket.io server URL from environment or default
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

    // Create socket instance
    const socketInstance = io(socketUrl);

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected!");
      setIsConnected(true);

      // Join game room
      socketInstance.emit("join_game", gameId);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("game_state_update", (newState) => {
      console.log("Game state updated:", newState);
      setGameState(newState);
    });

    // Set socket in state
    setSocket(
      socketInstance as Socket<ServerToClientEvents, ClientToServerEvents>
    );

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [gameId]);

  // UI Action helper function
  const sendUIAction = useCallback(
    (action: string, payload: Record<string, any>) => {
      if (socket && isConnected) {
        socket.emit("ui_action", {
          gameId,
          action,
          payload,
        });
      } else {
        console.warn("Cannot send UI action: Socket not connected");
      }
    },
    [socket, isConnected, gameId]
  );

  return {
    socket,
    isConnected,
    gameState,
    sendUIAction,
  };
}
