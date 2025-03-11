import { useEffect, useState, useCallback, useRef } from "react";
import {
  GameState,
  NodeInfo,
  StateUpdateMessage,
  UIActionMessage,
  NodeHealthData,
} from "../types/socket";

export default function useSocket(gameId: string = "player1") {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [gameOver, setGameOver] = useState<{ isOver: boolean; cause: string }>({
    isOver: false,
    cause: "",
  });

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
    mainNodeHealth: {
      currentHealth: 100,
      maxHealth: 100,
      healthPercentage: 1.0,
      lastUpdated: new Date(),
    },
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
        } else if (data.type === "node_health_update") {
          // Handle node health update
          const { nodeId, currentHealth, maxHealth, healthPercentage } = data;
          console.log(
            `Health update for node ${nodeId}: ${currentHealth}/${maxHealth}`
          );

          // Check if this is the main node
          if (nodeId === "main_node") {
            // Update main node health
            setGameState((prev) => ({
              ...prev,
              mainNodeHealth: {
                currentHealth,
                maxHealth,
                healthPercentage,
                lastUpdated: new Date(),
              },
            }));
          } else {
            // Update specific node's health
            setGameState((prev) => {
              if (!prev.nodes[nodeId]) return prev;

              return {
                ...prev,
                nodes: {
                  ...prev.nodes,
                  [nodeId]: {
                    ...prev.nodes[nodeId],
                    health: {
                      currentHealth,
                      maxHealth,
                      healthPercentage,
                      lastUpdated: new Date(),
                    },
                  },
                },
              };
            });
          }
        } else if (data.type === "game_over") {
          // Handle game over notification
          const { cause } = data;
          console.log(`Game over received! Cause: ${cause}`);

          setGameOver({
            isOver: true,
            cause: cause || "unknown",
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

  // Helper function to heal a node
  const healNode = useCallback(
    (nodeId: string, amount: number) => {
      if (isConnected) {
        sendUIAction("heal_node", {
          nodeId,
          amount,
        });
      }
    },
    [isConnected, sendUIAction]
  );

  // Helper function to stake tokens on a node
  const stakeTokens = useCallback(
    (nodeId: string, tokenType: string, amount: number) => {
      if (isConnected) {
        sendUIAction("stake_tokens", {
          nodeId,
          tokenType,
          amount,
        });
      }
    },
    [isConnected, sendUIAction]
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

  // Get main node health
  const getMainNodeHealth = useCallback((): NodeHealthData => {
    return gameState.mainNodeHealth;
  }, [gameState.mainNodeHealth]);

  // Reset game over state
  const resetGameOver = useCallback(() => {
    setGameOver({
      isOver: false,
      cause: "",
    });
  }, []);

  return {
    isConnected,
    gameState,
    gameOver,
    sendMessage,
    sendUIAction,
    selectNode,
    healNode,
    stakeTokens,
    getNodeById,
    getSelectedNode,
    getMainNodeHealth,
    resetGameOver,
  };
}
