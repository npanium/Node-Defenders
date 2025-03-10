import { useEffect, useState, useCallback, useRef } from "react";
import {
  GameState,
  NodeInfo,
  StateUpdateMessage,
  UIActionMessage,
} from "../types/socket";

export default function useSocket(gameId: string = "player1") {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    currency: 0,
    score: 0,
    enemiesKilled: 0,
    turretsPlaced: 0,
    liquidityPools: [],
    totalNodesPlaced: 0,
    nodeTypes: {},
    lastUpdated: new Date(),
    nodes: {},
    selectedNodeId: null,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    // Direct WebSocket URL (not using Socket.IO)
    const wsUrl = "ws://localhost:4000";

    // Create WebSocket instance
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Set up event listeners
    ws.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        if (data.type === "state_update") {
          console.log("Game state update received:", data.data);
          setGameState((prev) => ({
            ...prev,
            ...data.data,
          }));
        } else if (data.type === "node_stats_update") {
          // Handle node stats update
          const { nodeId, stats } = data;
          console.log(`Stats update for node ${nodeId}:`, stats);

          // Update node stats in local state
          setGameState((prev) => {
            if (!prev.nodes[nodeId]) return prev;

            return {
              ...prev,
              nodes: {
                ...prev.nodes,
                [nodeId]: {
                  ...prev.nodes[nodeId],
                  stats: stats,
                },
              },
            };
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Clean up on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [gameId]);

  // Helper function to send WebSocket messages
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  }, []);

  // Function to send UI action
  const sendUIAction = useCallback(
    (action: string, payload: Record<string, any>) => {
      if (isConnected) {
        const message: UIActionMessage = {
          type: "ui_action",
          action,
          payload,
        };
        sendMessage(message);
        console.log(`Sent UI action ${action}:`, payload);
      } else {
        console.warn("Cannot send UI action: WebSocket not connected");
      }
    },
    [isConnected, sendMessage]
  );

  // Function to select a node
  const selectNode = useCallback(
    (nodeId: string) => {
      if (isConnected) {
        sendMessage({
          type: "node_selected",
          nodeId: nodeId,
        });

        // Also update local state immediately for responsive UI
        setGameState((prev) => ({
          ...prev,
          selectedNodeId: nodeId,
        }));
      }
    },
    [isConnected, sendMessage]
  );

  // Get a single node by ID
  const getNodeById = useCallback(
    (nodeId: string): NodeInfo | undefined => {
      return gameState.nodes[nodeId];
    },
    [gameState.nodes]
  );

  // Get currently selected node (if any)
  const getSelectedNode = useCallback((): NodeInfo | undefined => {
    if (!gameState.selectedNodeId) return undefined;
    return gameState.nodes[gameState.selectedNodeId];
  }, [gameState.selectedNodeId, gameState.nodes]);

  return {
    isConnected,
    gameState,
    sendMessage,
    sendUIAction,
    selectNode,
    getNodeById,
    getSelectedNode,
  };
}
