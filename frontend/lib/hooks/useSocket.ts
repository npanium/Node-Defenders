import { useEffect, useState, useCallback, useRef } from "react";
import {
  GameState,
  NodeInfo,
  StateUpdateMessage,
  UIActionMessage,
  NodeHealthData,
  ActionConfirmedMessage,
} from "../types/socket";

// Constants
const RECONNECT_INTERVAL = 5000; // Time in ms to attempt reconnection
const WS_URL = "ws://localhost:4000";

export default function useSocket(gameId: string = "player1") {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Game state
  const [gameOver, setGameOver] = useState<{ isOver: boolean; cause: string }>({
    isOver: false,
    cause: "",
  });

  const [waveInfo, setWaveInfo] = useState<{
    currentWave: number;
    maxWaves: number;
    countdown: number;
    enemiesInWave: number;
    isCountingDown: boolean;
    isWaveInProgress: boolean;
  }>({
    currentWave: 1,
    maxWaves: 20,
    countdown: 0,
    enemiesInWave: 0,
    isCountingDown: false,
    isWaveInProgress: false,
  });

  const [gameWon, setGameWon] = useState<{
    isWon: boolean;
    reason: string;
  }>({
    isWon: false,
    reason: "",
  });

  const [gameStats, setGameStats] = useState<{
    currency: number;
    enemiesKilled: number;
  }>({
    currency: 0,
    enemiesKilled: 0,
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

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Create new WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
      setIsConnected(false);

      // Schedule reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connectWebSocket();
      }, RECONNECT_INTERVAL);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log("WebSocket message received:", data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }, []);

  // Centralized message handler
  const handleWebSocketMessage = useCallback((data: any) => {
    const messageType = data.type;

    switch (messageType) {
      case "state_update":
        // Deep merge for complex state
        setGameState((prev) => {
          const newState = { ...prev };

          // Handle primitive values
          for (const key in data.data) {
            if (
              (typeof data.data[key] !== "object" || data.data[key] === null) &&
              key in prev
            ) {
              // Use type assertion to tell TypeScript this is safe
              (newState as any)[key] = data.data[key];
            }
          }

          // Handle nodes object specially (to preserve references that might not be in update)
          if (data.data.nodes) {
            newState.nodes = { ...prev.nodes };
            for (const nodeId in data.data.nodes) {
              newState.nodes[nodeId] = {
                ...prev.nodes[nodeId],
                ...data.data.nodes[nodeId],
              };
            }
          }

          // Handle mainNodeHealth
          if (data.data.mainNodeHealth) {
            newState.mainNodeHealth = {
              ...prev.mainNodeHealth,
              ...data.data.mainNodeHealth,
            };
          }

          // Update node types
          if (data.data.nodeTypes) {
            newState.nodeTypes = {
              ...prev.nodeTypes,
              ...data.data.nodeTypes,
            };
          }

          // Update selected node ID
          if (data.data.selectedNodeId !== undefined) {
            newState.selectedNodeId = data.data.selectedNodeId;
          }

          return newState;
        });

        // Update stats state from game state if needed
        if (
          data.data.currency !== undefined ||
          data.data.enemiesKilled !== undefined
        ) {
          setGameStats((prev) => ({
            currency:
              data.data.currency !== undefined
                ? data.data.currency
                : prev.currency,
            enemiesKilled:
              data.data.enemiesKilled !== undefined
                ? data.data.enemiesKilled
                : prev.enemiesKilled,
          }));
        }
        break;

      case "action_confirmed":
        // Handle action confirmations
        handleActionConfirmation(data as ActionConfirmedMessage);
        break;

      case "node_stats_update":
        // Handle node stats update
        const { nodeId, stats } = data;
        setGameState((prev) => {
          if (!prev.nodes[nodeId]) return prev;

          const newNodes = { ...prev.nodes };
          newNodes[nodeId] = {
            ...newNodes[nodeId],
            stats: stats,
          };

          return {
            ...prev,
            nodes: newNodes,
          };
        });
        break;

      case "node_health_update":
        // Handle node health update
        const healthData = data;
        if (healthData.nodeId === "main_node") {
          // Update main node health
          setGameState((prev) => ({
            ...prev,
            mainNodeHealth: {
              currentHealth: healthData.currentHealth,
              maxHealth: healthData.maxHealth,
              healthPercentage:
                healthData.healthPercentage ||
                healthData.currentHealth / healthData.maxHealth,
              lastUpdated: new Date(),
            },
          }));
        } else {
          // Update specific node's health
          setGameState((prev) => {
            if (!prev.nodes[healthData.nodeId]) return prev;

            const newNodes = { ...prev.nodes };
            newNodes[healthData.nodeId] = {
              ...newNodes[healthData.nodeId],
              health: {
                currentHealth: healthData.currentHealth,
                maxHealth: healthData.maxHealth,
                healthPercentage:
                  healthData.healthPercentage ||
                  healthData.currentHealth / healthData.maxHealth,
                lastUpdated: new Date(),
              },
            };

            return {
              ...prev,
              nodes: newNodes,
            };
          });
        }
        break;

      case "wave_countdown":
        const { waveNumber, countdown, maxWaves } = data;
        setWaveInfo((prev) => ({
          ...prev,
          currentWave: waveNumber,
          maxWaves: maxWaves,
          countdown: countdown,
          isCountingDown: true,
          isWaveInProgress: false,
        }));
        break;

      case "wave_started":
        const waveData = data;
        setWaveInfo((prev) => ({
          ...prev,
          currentWave: waveData.waveNumber,
          maxWaves: waveData.maxWaves,
          enemiesInWave: waveData.enemiesInWave,
          isCountingDown: false,
          isWaveInProgress: true,
        }));
        break;

      case "enemy_destroyed":
        // Update game stats from enemy destroyed events
        // console.log("Enemy destroyed");
        setGameStats((prev) => ({
          currency: data.currency !== undefined ? data.currency : prev.currency,
          enemiesKilled:
            data.enemiesKilled !== undefined
              ? data.enemiesKilled
              : prev.enemiesKilled + 1,
        }));
        break;

      case "game_stats":
        // Update game stats
        setGameStats({
          currency: data.currency,
          enemiesKilled: data.enemiesKilled,
        });
        break;

      case "game_won":
        // Handle game won
        setGameWon({
          isWon: true,
          reason: data.reason,
        });
        break;

      case "game_over":
        // Handle game over
        setGameOver({
          isOver: true,
          cause: data.cause || "unknown",
        });
        break;

      case "game_reset":
        console.log("Game reset received from server");

        // Reset all game state to defaults
        setGameState({
          currency: 100,
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

        // Reset other state
        setGameStats({
          currency: 100,
          enemiesKilled: 0,
        });

        setWaveInfo({
          currentWave: 1,
          maxWaves: 20,
          countdown: 0,
          enemiesInWave: 0,
          isCountingDown: false,
          isWaveInProgress: false,
        });

        setGameOver({
          isOver: false,
          cause: "",
        });

        setGameWon({
          isWon: false,
          reason: "",
        });

        break;

      default:
        console.log(`Unhandled message type: ${messageType}`, data);
    }
  }, []);

  // Handle action confirmations
  const handleActionConfirmation = useCallback(
    (data: ActionConfirmedMessage) => {
      const { action, success, nodeId } = data;

      if (!success) {
        console.warn(`Action ${action} failed`);
        return;
      }

      // Handle specific action confirmations
      switch (action) {
        case "node_placed":
          if (data.newTotal !== undefined) {
            setGameState((prev) => ({
              ...prev,
              totalNodesPlaced: data.newTotal,
            }));
          }
          break;
        case "node_selected":
          if (nodeId) {
            setGameState((prev) => ({
              ...prev,
              selectedNodeId: nodeId,
            }));
          }
          break;
      }
    },
    []
  );

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    // Clean up on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

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
        // console.log(`Sent UI action ${action}:`, payload);
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

  // Reset game won state
  const resetGameWon = useCallback(() => {
    setGameWon({
      isWon: false,
      reason: "",
    });
  }, []);

  const resetGame = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: "game_reset",
        timestamp: new Date().toISOString(),
      });

      setGameState({
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

      setGameStats({
        currency: 100,
        enemiesKilled: 0,
      });

      setWaveInfo({
        currentWave: 1,
        maxWaves: 20,
        countdown: 0,
        enemiesInWave: 0,
        isCountingDown: false,
        isWaveInProgress: false,
      });

      setGameOver({
        isOver: false,
        cause: "",
      });

      setGameWon({
        isWon: false,
        reason: "",
      });
    }
  }, [isConnected, sendMessage]);

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
    waveInfo,
    gameWon,
    gameStats,
    resetGameWon,
    resetGame,
  };
}
