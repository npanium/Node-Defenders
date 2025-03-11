import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import http from "http";
import {
  ActionConfirmedMessage,
  ClientMessage,
  GameState,
  StateUpdateMessage,
  NodeInfo,
  NodeStatsData,
} from "./types";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const HTTP_PORT = 3000;

// Enhanced game state to track individual nodes
const gameState: GameState = {
  totalNodesPlaced: 0,
  nodeTypes: {}, // Track different types of nodes
  lastUpdated: new Date(),
  nodes: {}, // Track individual nodes with their IDs
  selectedNodeId: null, // Track which node is currently selected
  mainNodeHealth: {
    currentHealth: 100,
    maxHealth: 100,
    healthPercentage: 1.0,
    lastUpdated: new Date(),
  },
};

// Tracking recent node placements for deduplication
const recentPlacements = new Map<string, number>(); // node_type -> timestamp
const DEDUPLICATION_WINDOW_MS = 1000; // 1 second window for deduplication

const server = http.createServer(app);

const wss = new WebSocketServer({ server }, () => {
  console.log("server started");
});

// Define the type for message handlers
type MessageHandler = (ws: WebSocket, message: any) => void;

// Message handler map with index signature
const messageHandlers: { [key: string]: MessageHandler } = {
  // Handle node placement
  node_placed: (ws: WebSocket, message: any) => {
    const nodeType = message.nodeType || "default";

    // Check for duplicate placement
    if (isDuplicatePlacement(nodeType)) {
      console.log("Ignoring duplicate node placement for type:", nodeType);
      return;
    }

    // Record this placement for deduplication
    recordPlacement(nodeType);

    gameState.totalNodesPlaced++;
    gameState.nodeTypes[nodeType] = (gameState.nodeTypes[nodeType] || 0) + 1;

    // Generate a unique ID for the node if not provided
    const nodeId =
      message.nodeId ||
      `node_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Get node stats from message or generate defaults
    const nodeStats = message.stats || getDefaultStats(nodeType);

    // Store the node information
    gameState.nodes[nodeId] = {
      id: nodeId,
      type: nodeType,
      position: message.position || { x: 0, y: 0, z: 0 },
      createdAt: new Date(),
      stats: nodeStats,
    };

    gameState.lastUpdated = new Date();

    broadcastGameState();

    // Send acknowledgment back to the sender with node ID
    const response: ActionConfirmedMessage = {
      type: "action_confirmed",
      action: "node_placed",
      success: true,
      newTotal: gameState.totalNodesPlaced,
      nodeId: nodeId,
    };
    console.log("Total nodes: ", gameState.totalNodesPlaced);

    ws.send(JSON.stringify(response));
  },

  // Handle node destruction
  node_destroyed: (ws: WebSocket, message: any) => {
    // Decrement nodes if a node is destroyed
    if (gameState.totalNodesPlaced > 0) {
      gameState.totalNodesPlaced--;

      // Update node type counts if provided
      const nodeType = message.nodeType || "default";
      if (gameState.nodeTypes[nodeType] && gameState.nodeTypes[nodeType] > 0) {
        gameState.nodeTypes[nodeType]--;
      }

      // Remove the node if ID is provided
      if (message.nodeId && gameState.nodes[message.nodeId]) {
        delete gameState.nodes[message.nodeId];
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
    // Update the selected node in the game state
    const nodeId = message.nodeId;

    if (nodeId && gameState.nodes[nodeId]) {
      gameState.selectedNodeId = nodeId;

      // Broadcast the updated state so all clients know which node is selected
      broadcastGameState();

      const response = {
        type: "action_confirmed",
        action: "node_selected",
        success: true,
        nodeId: nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      // If node doesn't exist, send failure
      const response = {
        type: "action_confirmed",
        action: "node_selected",
        success: false,
      };

      ws.send(JSON.stringify(response));
    }
  },

  // Handle node stats updates
  node_stats_update: (ws: WebSocket, message: any) => {
    // Handle node stats update from either game or frontend
    const nodeId = message.nodeId;
    const stats = message.stats;

    if (nodeId && stats && gameState.nodes[nodeId]) {
      // Update node stats in game state
      gameState.nodes[nodeId].stats = stats;
      gameState.lastUpdated = new Date();

      // Log the update
      console.log(`Updated stats for node ${nodeId}:`, stats);

      // Broadcast the update to all clients
      broadcastGameState();

      // Send specific node stats update message
      const nodeStatsUpdateMsg = {
        type: "node_stats_update",
        nodeId: nodeId,
        stats: stats,
      };

      // Broadcast to all clients (including the sender)
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(nodeStatsUpdateMsg));
        }
      });

      // Send success response to the sender
      const response = {
        type: "action_confirmed",
        action: "node_stats_update",
        success: true,
        nodeId: nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      // If node doesn't exist, send failure
      const response = {
        type: "action_confirmed",
        action: "node_stats_update",
        success: false,
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

        console.log(`Node ${nodeId} stats updated from staking:`, stats);

        // Broadcast the update to all clients
        broadcastGameState();

        // Send specific node stats update message
        const nodeStatsUpdateMsg = {
          type: "node_stats_update",
          nodeId: nodeId,
          stats: stats,
        };

        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(nodeStatsUpdateMsg));
          }
        });

        // Send success response
        const response = {
          type: "action_confirmed",
          action: "stake_tokens",
          success: true,
          nodeId: nodeId,
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

        console.log(
          `Healed main node for ${amount} health points. New health: ${newHealth}/${maxHealth}`
        );

        // Send health update to all clients
        const healthUpdateMsg = {
          type: "node_health_update",
          nodeId: "main_node",
          currentHealth: newHealth,
          maxHealth,
          healthPercentage: newHealth / maxHealth,
        };

        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(healthUpdateMsg));
          }
        });

        // Send success response
        const response = {
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

        // Calculate new health
        const currentHealth = node.health?.currentHealth || 100;
        const maxHealth = node.health?.maxHealth || 100;
        const newHealth = Math.min(currentHealth + amount, maxHealth);

        // Update the health
        if (!node.health) {
          node.health = {
            currentHealth: newHealth,
            maxHealth,
            healthPercentage: newHealth / maxHealth,
            lastUpdated: new Date(),
          };
        } else {
          node.health.currentHealth = newHealth;
          node.health.healthPercentage = newHealth / maxHealth;
          node.health.lastUpdated = new Date();
        }

        console.log(
          `Healed node ${nodeId} for ${amount} health points. New health: ${newHealth}/${maxHealth}`
        );

        // Send health update to all clients
        const healthUpdateMsg = {
          type: "node_health_update",
          nodeId,
          currentHealth: newHealth,
          maxHealth,
          healthPercentage: newHealth / maxHealth,
        };

        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(healthUpdateMsg));
          }
        });

        // Send success response
        const response = {
          type: "action_confirmed",
          action: "heal_node",
          success: true,
          nodeId,
        };

        ws.send(JSON.stringify(response));
      }
    }
  },

  // Handle game over notifications
  game_over: (ws: WebSocket, message: any) => {
    const cause = message.cause || "unknown";

    console.log(`Game over notification received. Cause: ${cause}`);

    // Broadcast game over to all clients
    const gameOverMsg = {
      type: "game_over",
      cause,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(gameOverMsg));
      }
    });

    // Send success response
    const response = {
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
    const healthPercentage = message.healthPercentage;

    // Special handling for main node
    if (nodeId === "main_node") {
      // Update main node health in game state
      gameState.mainNodeHealth = {
        currentHealth,
        maxHealth,
        healthPercentage,
        lastUpdated: new Date(),
      };

      console.log(`Updated main node health: ${currentHealth}/${maxHealth}`);

      // Broadcast the health update to all clients
      const healthUpdateMsg = {
        type: "node_health_update",
        nodeId: "main_node",
        currentHealth,
        maxHealth,
        healthPercentage,
      };

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(healthUpdateMsg));
        }
      });

      // Send success response
      const response = {
        type: "action_confirmed",
        action: "node_health_update",
        success: true,
      };

      ws.send(JSON.stringify(response));
    }
    // Handle health updates for regular nodes
    else if (nodeId && gameState.nodes[nodeId]) {
      // Update node health in game state
      gameState.nodes[nodeId].health = {
        currentHealth,
        maxHealth,
        healthPercentage,
        lastUpdated: new Date(),
      };

      console.log(
        `Updated node ${nodeId} health: ${currentHealth}/${maxHealth}`
      );

      // Broadcast the health update to all clients
      const healthUpdateMsg = {
        type: "node_health_update",
        nodeId,
        currentHealth,
        maxHealth,
        healthPercentage,
      };

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(healthUpdateMsg));
        }
      });

      // Send success response
      const response = {
        type: "action_confirmed",
        action: "node_health_update",
        success: true,
        nodeId,
      };

      ws.send(JSON.stringify(response));
    } else {
      // If node doesn't exist, send failure
      const response = {
        type: "action_confirmed",
        action: "node_health_update",
        success: false,
      };

      ws.send(JSON.stringify(response));
    }
  },

  // Default handler for unrecognized message types
  text: (ws: WebSocket, message: any) => {
    if (message.content) {
      console.log("Text message received:", message.content);
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

      console.log("Received message:", message);

      // Find the appropriate handler based on message type
      const handler = messageHandlers[message.type] || messageHandlers.text;

      // Execute the handler
      handler(ws, message);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });
});

// Check if a placement is a duplicate (same type within time window)
function isDuplicatePlacement(nodeType: string): boolean {
  const lastPlacement = recentPlacements.get(nodeType);
  if (!lastPlacement) return false;

  const now = Date.now();
  return now - lastPlacement < DEDUPLICATION_WINDOW_MS;
}

// Record a placement for deduplication
function recordPlacement(nodeType: string): void {
  recentPlacements.set(nodeType, Date.now());

  // Clean up old entries periodically
  if (recentPlacements.size > 100) {
    const now = Date.now();
    for (const [type, timestamp] of recentPlacements.entries()) {
      if (now - timestamp > DEDUPLICATION_WINDOW_MS * 2) {
        recentPlacements.delete(type);
      }
    }
  }
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP endpoints available on port ${PORT}`);
});
