import { WebSocket, WebSocketServer } from "ws";
import { ethers } from "ethers";
import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import {
  ActionConfirmedMessage,
  ClientMessage,
  GameState,
  StateUpdateMessage,
  NodeInfo,
  NodeStatsData,
} from "./types";

import { abi as TokenDistributorABI } from "./lib/contracts/TokenDistributor.sol/TokenDistributor.json";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const HTTP_PORT = 3000;
const DEDUPLICATION_WINDOW_MS = 1000; // 1 second window for deduplication

const TOKEN_DISTRIBUTOR_ADDRESS = process.env.TOKEN_DISTRIBUTOR_ADDRESS;
const PRIVATE_KEY = process.env.DISTRIBUTOR_PRIVATE_KEY;
const RPC_URL = process.env.SCROLL_RPC_URL || "https://sepolia-rpc.scroll.io/";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY || "", provider);
const distributorContract = new ethers.Contract(
  TOKEN_DISTRIBUTOR_ADDRESS || "",
  TokenDistributorABI,
  wallet
);

const gameState: GameState = {
  totalNodesPlaced: 0,
  nodeTypes: {}, // Track different types of nodes
  lastUpdated: new Date(),
  enemiesInWave: 0,
  enemiesKilled: 0,
  isCountingDown: false,
  currency: 0,
  nodes: {}, // Track individual nodes with their IDs
  selectedNodeId: null, // Track which node is currently selected
  currentWave: 1,
  nextWaveCountdown: 15,
  maxWaves: 20,
  mainNodeHealth: {
    currentHealth: 100,
    maxHealth: 100,
    healthPercentage: 1.0,
    lastUpdated: new Date(),
  },
};

// Tracking recent node placements for deduplication
const recentActions = new Map<string, number>();

const server = http.createServer(app);

const wss = new WebSocketServer({ server }, () => {
  console.log("server started");
});

// Define the type for message handlers
type MessageHandler = (ws: WebSocket, message: any) => void;

// Message handler map with index signature
const messageHandlers: { [key: string]: MessageHandler } = {
  node_placed: (ws: WebSocket, message: any) => {
    const nodeType = message.nodeType || "default";
    const actionId = `node_placed_${nodeType}_${Date.now()}`;

    // Check for duplicate action
    if (isDuplicateAction(actionId)) {
      console.log("Ignoring duplicate node placement for type:", nodeType);
      return;
    }

    // Record this action
    recordAction(actionId);

    // Update game state
    gameState.totalNodesPlaced++;
    gameState.nodeTypes[nodeType] = (gameState.nodeTypes[nodeType] || 0) + 1;
    gameState.lastUpdated = new Date();

    // Generate a unique ID for the node
    const nodeId =
      message.nodeId ||
      `node_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Get node stats
    const nodeStats = message.stats || getDefaultStats(nodeType);

    // Store complete node information with consistent structure
    gameState.nodes[nodeId] = {
      id: nodeId,
      type: nodeType,
      position: message.position || { x: 0, y: 0, z: 0 },
      createdAt: new Date(),
      stats: nodeStats,
      health: {
        currentHealth: 100,
        maxHealth: 100,
        healthPercentage: 1.0,
        lastUpdated: new Date(),
      },
    };

    // Broadcast state update
    broadcastGameState();

    // Send acknowledgment
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "node_placed",
      success: true,
      newTotal: gameState.totalNodesPlaced,
      nodeId: nodeId,
    };

    ws.send(JSON.stringify(response));
  },

  // Handle node destruction
  node_destroyed: (ws: WebSocket, message: any) => {
    const nodeId = message.nodeId;
    const nodeType = message.nodeType || "default";

    // Skip if no ID provided
    if (!nodeId || !gameState.nodes[nodeId]) {
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_destroyed",
        success: false,
        message: "Node not found",
      };
      ws.send(JSON.stringify(response));
      return;
    }

    // Update state
    if (gameState.totalNodesPlaced > 0) {
      gameState.totalNodesPlaced--;

      if (gameState.nodeTypes[nodeType] && gameState.nodeTypes[nodeType] > 0) {
        gameState.nodeTypes[nodeType]--;
      }

      delete gameState.nodes[nodeId];

      // Clear selection if the destroyed node was selected
      if (gameState.selectedNodeId === nodeId) {
        gameState.selectedNodeId = null;
      }

      gameState.lastUpdated = new Date();
      broadcastGameState();
    }

    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "node_destroyed",
      success: true,
      newTotal: gameState.totalNodesPlaced,
    };

    ws.send(JSON.stringify(response));
  },

  // Handle node selection
  node_selected: (ws: WebSocket, message: any) => {
    const nodeId = message.nodeId;

    if (nodeId && (nodeId === "main_node" || gameState.nodes[nodeId])) {
      gameState.selectedNodeId = nodeId;
      gameState.lastUpdated = new Date();

      // Broadcast the updated state
      broadcastGameState();

      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_selected",
        success: true,
        nodeId: nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_selected",
        success: false,
        message: "Node not found",
      };

      ws.send(JSON.stringify(response));
    }
  },

  // Handle node stats updates
  node_stats_update: (ws: WebSocket, message: any) => {
    const nodeId = message.nodeId;
    const stats = message.stats;

    if (nodeId && stats && gameState.nodes[nodeId]) {
      // Update node stats
      gameState.nodes[nodeId].stats = stats;
      gameState.lastUpdated = new Date();

      // Log the update
      console.log(`Updated stats for node ${nodeId}:`, stats);

      // Send specific node stats update message first
      const nodeStatsUpdateMsg = {
        type: "node_stats_update",
        nodeId: nodeId,
        stats: stats,
      };

      broadcastMessage(nodeStatsUpdateMsg);

      // Then broadcast full state update
      broadcastGameState();

      // Send confirmation
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_stats_update",
        success: true,
        nodeId: nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_stats_update",
        success: false,
        message: "Node not found or missing stats",
      };

      ws.send(JSON.stringify(response));
    }
  },

  // Handle UI actions
  ui_action: (ws: WebSocket, message: any) => {
    const action = message.action;
    const payload = message.payload;

    if (action === "stake_tokens" && payload && payload.nodeId) {
      const { nodeId, tokenType, amount } = payload;

      if (gameState.nodes[nodeId]) {
        const node = gameState.nodes[nodeId];
        const stats = node.stats || getDefaultStats(node.type);

        // Update stats based on token type
        if (tokenType === "gods") {
          stats.damage += amount * 0.1; // Gods tokens boost damage
        } else if (tokenType === "soul") {
          stats.range += amount * 0.05; // Soul tokens boost range
          stats.speed += amount * 0.05; // Soul tokens boost speed
        }

        // Update node stats
        node.stats = stats;
        gameState.lastUpdated = new Date();

        // Send specific update first
        const nodeStatsUpdateMsg = {
          type: "node_stats_update",
          nodeId: nodeId,
          stats: stats,
        };

        broadcastMessage(nodeStatsUpdateMsg);

        // Then broadcast complete state
        broadcastGameState();

        // Send confirmation
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "stake_tokens",
          success: true,
          nodeId: nodeId,
        };

        ws.send(JSON.stringify(response));
      } else {
        // Node not found
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "stake_tokens",
          success: false,
          message: "Node not found",
        };

        ws.send(JSON.stringify(response));
      }
    } else if (action === "heal_node" && payload && payload.nodeId) {
      const { nodeId, amount } = payload;

      // Handle healing the main node
      if (nodeId === "main_node" && gameState.mainNodeHealth) {
        // Calculate new health
        const currentHealth = gameState.mainNodeHealth.currentHealth;
        const maxHealth = gameState.mainNodeHealth.maxHealth;
        const newHealth = Math.min(currentHealth + amount, maxHealth);

        // Update the health
        gameState.mainNodeHealth.currentHealth = newHealth;
        gameState.mainNodeHealth.healthPercentage = newHealth / maxHealth;
        gameState.mainNodeHealth.lastUpdated = new Date();
        gameState.lastUpdated = new Date();

        // Send health update
        const healthUpdateMsg = {
          type: "node_health_update",
          nodeId: "main_node",
          currentHealth: newHealth,
          maxHealth,
          healthPercentage: newHealth / maxHealth,
        };

        broadcastMessage(healthUpdateMsg);

        // Then broadcast complete state
        broadcastGameState();

        // Send confirmation
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "heal_node",
          success: true,
          nodeId: "main_node",
        };

        ws.send(JSON.stringify(response));
      }
      // Handle healing a regular node
      else if (nodeId && gameState.nodes[nodeId]) {
        const node = gameState.nodes[nodeId];

        if (!node.health) {
          // Initialize health if missing
          node.health = {
            currentHealth: 100,
            maxHealth: 100,
            healthPercentage: 1.0,
            lastUpdated: new Date(),
          };
        }

        // Calculate new health
        const currentHealth = node.health.currentHealth;
        const maxHealth = node.health.maxHealth;
        const newHealth = Math.min(currentHealth + amount, maxHealth);

        // Update the health
        node.health.currentHealth = newHealth;
        node.health.healthPercentage = newHealth / maxHealth;
        node.health.lastUpdated = new Date();
        gameState.lastUpdated = new Date();

        // Send health update
        const healthUpdateMsg = {
          type: "node_health_update",
          nodeId,
          currentHealth: newHealth,
          maxHealth,
          healthPercentage: newHealth / maxHealth,
        };

        broadcastMessage(healthUpdateMsg);

        // Then broadcast state
        broadcastGameState();

        // Send confirmation
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "heal_node",
          success: true,
          nodeId,
        };

        ws.send(JSON.stringify(response));
      } else {
        // Node not found
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "heal_node",
          success: false,
          message: "Node not found",
        };

        ws.send(JSON.stringify(response));
      }
    } else {
      // Unknown action
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: action || "unknown",
        success: false,
        message: "Unknown or malformed action",
      };

      ws.send(JSON.stringify(response));
    }
  },

  // Handle game over notifications
  game_over: (ws: WebSocket, message: any) => {
    const cause = message.cause || "unknown";

    console.log(`[GameOver] Game over cause: ${cause}`);
    // Broadcast game over to all clients
    const gameOverMsg = {
      type: "game_over",
      cause,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(gameOverMsg);

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "game_over",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  // Handle node health updates
  node_health_update: (ws: WebSocket, message: any) => {
    const nodeId = message.nodeId;
    const currentHealth = message.currentHealth;
    const maxHealth = message.maxHealth;
    const healthPercentage = currentHealth / maxHealth;

    // Special handling for main node
    if (nodeId === "main_node") {
      // Update main node health
      gameState.mainNodeHealth = {
        currentHealth,
        maxHealth,
        healthPercentage,
        lastUpdated: new Date(),
      };
      gameState.lastUpdated = new Date();

      // Send the health update
      const healthUpdateMsg = {
        type: "node_health_update",
        nodeId: "main_node",
        currentHealth,
        maxHealth,
        healthPercentage,
      };

      broadcastMessage(healthUpdateMsg);
      broadcastGameState();

      // Send confirmation
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_health_update",
        success: true,
        nodeId: "main_node",
      };

      ws.send(JSON.stringify(response));
    }
    // Handle regular nodes
    else if (nodeId && gameState.nodes[nodeId]) {
      // Update node health
      gameState.nodes[nodeId].health = {
        currentHealth,
        maxHealth,
        healthPercentage,
        lastUpdated: new Date(),
      };
      gameState.lastUpdated = new Date();

      // Send the health update
      const healthUpdateMsg = {
        type: "node_health_update",
        nodeId,
        currentHealth,
        maxHealth,
        healthPercentage,
      };

      broadcastMessage(healthUpdateMsg);
      broadcastGameState();

      // Send confirmation
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_health_update",
        success: true,
        nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      // Node not found
      const response: ActionConfirmedMessage = {
        type: "action_confirmed",
        action: "node_health_update",
        success: false,
        message: "Node not found",
      };

      ws.send(JSON.stringify(response));
    }
  },

  currency_update: (ws: WebSocket, message: any) => {
    const amount = message.amount || 0;
    const operation = message.operation || "unknown";
    const balance = message.balance;

    // Update game state with the new balance from the client
    if (balance !== undefined) {
      gameState.currency = balance;
      gameState.lastUpdated = new Date();
    } else if (operation === "decrease" && amount) {
      // Fallback behavior if balance not provided
      gameState.currency = Math.max(0, (gameState.currency || 0) - amount);
      gameState.lastUpdated = new Date();
    } else if (operation === "increase" && amount) {
      // Fallback behavior if balance not provided
      gameState.currency = (gameState.currency || 0) + amount;
      gameState.lastUpdated = new Date();
    }

    console.log(
      `Currency ${operation}: ${amount}, new balance: ${gameState.currency}`
    );

    // Send a currency update message
    const currencyUpdateMsg = {
      type: "currency_update",
      amount,
      operation,
      balance: gameState.currency,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(currencyUpdateMsg);

    // Also update the full game state
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "currency_update",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  // Handle wave countdown
  wave_countdown: (ws: WebSocket, message: any) => {
    const waveNumber = message.waveNumber;
    const countdown = message.countdown;
    const maxWaves = message.maxWaves;

    // Update game state
    gameState.currentWave = waveNumber;
    gameState.nextWaveCountdown = countdown;
    gameState.maxWaves = maxWaves;
    gameState.isCountingDown = true;
    gameState.lastUpdated = new Date();

    // Send countdown message
    const countdownMsg = {
      type: "wave_countdown",
      waveNumber,
      countdown,
      maxWaves,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(countdownMsg);
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "wave_countdown",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  enemy_killed: (ws: WebSocket, message: any) => {
    const currencyEarned = message.currencyEarned || 0;
    console.log("enemy destroyed");
    // Update game state
    gameState.currency = (gameState.currency || 0) + currencyEarned;
    gameState.enemiesKilled = (gameState.enemiesKilled || 0) + 1;
    gameState.lastUpdated = new Date();

    // Send specific enemy destroyed notification
    const enemyDestroyedMsg = {
      type: "enemy_destroyed",
      currencyEarned,
      enemiesKilled: gameState.enemiesKilled,
      currency: gameState.currency,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(enemyDestroyedMsg);

    // Also broadcast state update to ensure consistency
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "enemy_destroyed",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  wave_started: (ws: WebSocket, message: any) => {
    const waveNumber = message.waveNumber;
    const enemiesInWave = message.enemiesInWave;
    const maxWaves = message.maxWaves;

    // Update game state
    gameState.currentWave = waveNumber;
    gameState.maxWaves = maxWaves;
    gameState.enemiesInWave = enemiesInWave;
    gameState.isCountingDown = false;
    gameState.lastUpdated = new Date();

    // Send wave started message
    const waveStartedMsg = {
      type: "wave_started",
      waveNumber,
      enemiesInWave,
      maxWaves,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(waveStartedMsg);
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "wave_started",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  game_stats: (ws: WebSocket, message: any) => {
    const currency = message.currency || 0;
    const enemiesKilled = message.enemiesKilled || 0;

    // Update game state
    gameState.currency = currency;
    gameState.enemiesKilled = enemiesKilled;
    gameState.lastUpdated = new Date();

    console.log(`[GameStats currency]: ${currency}`);
    // Send game stats message
    const gameStatsMsg = {
      type: "game_stats",
      currency,
      enemiesKilled,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(gameStatsMsg);
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "game_stats",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  game_won: (ws: WebSocket, message: any) => {
    const reason = message.reason || "unknown";

    // Send game won message
    const gameWonMsg = {
      type: "game_won",
      reason,
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(gameWonMsg);

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "game_won",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  // Add this to your messageHandlers object
  game_reset: (ws: WebSocket, message: any) => {
    console.log("Game reset requested");

    // Reset the game state to initial values
    gameState.totalNodesPlaced = 0;
    gameState.nodeTypes = {};
    gameState.nodes = {};
    gameState.enemiesInWave = 0;
    gameState.enemiesKilled = 0;
    gameState.isCountingDown = false;
    gameState.currency = 0;
    gameState.selectedNodeId = null;
    gameState.currentWave = 1;
    gameState.nextWaveCountdown = 15;
    gameState.maxWaves = 20;
    gameState.mainNodeHealth = {
      currentHealth: 100,
      maxHealth: 100,
      healthPercentage: 1.0,
      lastUpdated: new Date(),
    };
    gameState.lastUpdated = new Date();

    // Broadcast reset state to all clients
    const resetMsg = {
      type: "game_reset",
      timestamp: new Date().toISOString(),
    };

    broadcastMessage(resetMsg);

    // Also broadcast the full reset game state
    broadcastGameState();

    // Send confirmation
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "game_reset",
      success: true,
    };

    ws.send(JSON.stringify(response));
  },

  // Default handler for unrecognized message types
  text: (ws: WebSocket, message: any) => {
    if (message.content) {
      console.log("Text message received:", message.content);

      // Send a simple acknowledgment
      ws.send(
        JSON.stringify({
          type: "text_received",
          success: true,
          timestamp: new Date().toISOString(),
        })
      );
    }
  },
};

wss.on("connection", function connection(ws: WebSocket) {
  console.log("Client connected to WebSocket");

  const stateMessage: StateUpdateMessage = {
    type: "state_update",
    data: gameState,
  };

  ws.send(JSON.stringify(stateMessage));

  ws.on("message", (data) => {
    try {
      // Try to parse as JSON first
      let message: ClientMessage;
      try {
        message = JSON.parse(data.toString());
      } catch (e) {
        // If not valid JSON, treat as text
        message = { type: "text", content: data.toString() };
      }

      console.log("Received message type:", message.type);

      // Find the appropriate handler based on message type
      const handler = messageHandlers[message.type] || messageHandlers.text;

      // Execute the handler
      handler(ws, message);
    } catch (error: any) {
      console.error("Error processing message:", error);

      // Send error response
      try {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Error processing message",
            details: error.message,
          })
        );
      } catch (sendError) {
        console.error("Error sending error response:", sendError);
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function isDuplicateAction(actionId: string): boolean {
  const lastAction = recentActions.get(actionId);
  if (!lastAction) return false;

  const now = Date.now();
  return now - lastAction < DEDUPLICATION_WINDOW_MS;
}

// Function to record an action for deduplication (to replace recordPlacement)
function recordAction(actionId: string): void {
  recentActions.set(actionId, Date.now());

  // Clean up old entries periodically
  if (recentActions.size > 100) {
    const now = Date.now();
    for (const [action, timestamp] of recentActions.entries()) {
      if (now - timestamp > DEDUPLICATION_WINDOW_MS * 2) {
        recentActions.delete(action);
      }
    }
  }
}

// Function to broadcast a message to all connected clients
function broadcastMessage(message: any): void {
  const messageString = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}
function getDefaultStats(nodeType: string): NodeStatsData {
  switch (nodeType.toLowerCase()) {
    case "validator":
      return { damage: 3, range: 2.5, speed: 4, efficiency: 5 };
    case "harvester":
      return { damage: 2, range: 2, speed: 3, efficiency: 7 };
    case "defender":
      return { damage: 4, range: 5, speed: 2, efficiency: 3 };
    case "attacker":
      return { damage: 7, range: 3, speed: 5, efficiency: 2 };
    default:
      return { damage: 3, range: 3, speed: 3, efficiency: 3 };
  }
}

function broadcastGameState(): void {
  const stateMessage: StateUpdateMessage = {
    type: "state_update",
    data: gameState,
  };

  console.log(
    `[broadcastGameState]: Broadcasting to ${wss.clients.size} clients`
  );

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(stateMessage));
    }
  });
}

// HTTP endpoints for frontend to fetch game state
app.get("/api/game-state", (req, res) => {
  res.json({
    success: true,
    data: gameState,
  });
});

app.post("/api/mint-tokens", async (req, res) => {
  try {
    const { address, soulAmount, godsAmount } = req.body;

    // Validate the input
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

    if (soulAmount < 0 || godsAmount < 0) {
      return res.status(400).json({
        success: false,
        error: "Token amounts must be non-negative",
      });
    }

    console.log(
      `Minting ${soulAmount} SOUL and ${godsAmount} GODS for ${address}`
    );

    // Convert token amounts to wei
    const soulAmountWei = ethers.parseUnits(soulAmount.toString(), 18);
    const godsAmountWei = ethers.parseUnits(godsAmount.toString(), 18);

    // Call the contract function to mint tokens
    const tx = await distributorContract.authorizedMint(
      address,
      soulAmountWei,
      godsAmountWei
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Return success response
    return res.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    console.error("Error minting tokens:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mint tokens",
      details: error.message,
    });
  }
});
// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP endpoints available on port ${PORT}`);
});
