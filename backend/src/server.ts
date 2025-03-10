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
};

// Tracking recent node placements for deduplication
const recentPlacements = new Map<string, number>(); // node_type -> timestamp
const DEDUPLICATION_WINDOW_MS = 1000; // 1 second window for deduplication

const server = http.createServer(app);

const wss = new WebSocketServer({ server }, () => {
  console.log("server started");
});

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

      // Handle different message types
      if (message.type === "node_placed") {
        const nodeType = message.nodeType || "default";

        // Check for duplicate placement
        if (isDuplicatePlacement(nodeType)) {
          console.log("Ignoring duplicate node placement for type:", nodeType);
          return;
        }

        // Record this placement for deduplication
        recordPlacement(nodeType);

        gameState.totalNodesPlaced++;
        gameState.nodeTypes[nodeType] =
          (gameState.nodeTypes[nodeType] || 0) + 1;

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
      } else if (message.type === "node_destroyed") {
        // Decrement nodes if a node is destroyed
        if (gameState.totalNodesPlaced > 0) {
          gameState.totalNodesPlaced--;

          // Update node type counts if provided
          const nodeType = message.nodeType || "default";
          if (
            gameState.nodeTypes[nodeType] &&
            gameState.nodeTypes[nodeType] > 0
          ) {
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
      } else if (message.type === "node_selected") {
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
      } else if (message.type === "node_stats_update") {
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
      }
      // Handle UI actions from the frontend
      else if (message.type === "ui_action") {
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
        }
      }
      // Handle plain text messages (legacy support)
      else if ("content" in message && message.content) {
        console.log("Text message received:", message.content);

        // If it contains position data, try to parse it
        if (message.content.includes("Node placed:")) {
          const parts = message.content.split(" at position ");
          if (parts.length > 1) {
            try {
              // Extract node type if available
              const nodeParts = parts[0].split("Node placed: ");
              const nodeType = nodeParts.length > 1 ? nodeParts[1] : "default";

              // Check for duplicate placement
              if (isDuplicatePlacement(nodeType)) {
                console.log(
                  "Ignoring duplicate text node placement for type:",
                  nodeType
                );
                return;
              }

              // Record this placement for deduplication
              recordPlacement(nodeType);

              // Extract the position from the message
              const positionStr = parts[1].trim();
              const posMatch = positionStr.match(
                /\(?([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)?/
              );

              if (posMatch) {
                const position = {
                  x: parseFloat(posMatch[1]),
                  y: parseFloat(posMatch[2]),
                  z: parseFloat(posMatch[3]),
                };

                // Generate a node ID
                const nodeId = `node_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2, 10)}`;

                // Default stats for the node
                const stats = getDefaultStats(nodeType);

                // Store the node
                gameState.nodes[nodeId] = {
                  id: nodeId,
                  type: nodeType,
                  position: position,
                  createdAt: new Date(),
                  stats: stats,
                };

                gameState.totalNodesPlaced++;
                gameState.lastUpdated = new Date();
                broadcastGameState();

                // Send a response with the node ID
                const response = {
                  type: "action_confirmed",
                  action: "node_placed",
                  success: true,
                  newTotal: gameState.totalNodesPlaced,
                  nodeId: nodeId,
                };

                ws.send(JSON.stringify(response));
              }
            } catch (e) {
              console.error("Error parsing position:", e);
            }
          }
        }
      }
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
