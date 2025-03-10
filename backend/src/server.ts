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
        gameState.totalNodesPlaced++;

        const nodeType = message.nodeType || "default";
        gameState.nodeTypes[nodeType] =
          (gameState.nodeTypes[nodeType] || 0) + 1;

        // Generate a unique ID for the node if not provided
        const nodeId =
          message.nodeId ||
          `node_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Store the node information
        gameState.nodes[nodeId] = {
          id: nodeId,
          type: nodeType,
          position: message.position || { x: 0, y: 0, z: 0 },
          createdAt: new Date(),
          stats: message.stats || getDefaultStats(nodeType),
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
      }
      // Handle plain text messages (legacy support)
      else if ("content" in message && message.content) {
        console.log("Text message received:", message.content);

        // If it contains position data, try to parse it
        if (message.content.includes("Node placed:")) {
          const parts = message.content.split(" at position ");
          if (parts.length > 1) {
            try {
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

                // Extract node type if available
                const nodeParts = parts[0].split("Node placed: ");
                const nodeType =
                  nodeParts.length > 1 ? nodeParts[1] : "default";

                // Generate a node ID
                const nodeId = `node_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2, 10)}`;

                // Store the node
                gameState.nodes[nodeId] = {
                  id: nodeId,
                  type: nodeType,
                  position: position,
                  createdAt: new Date(),
                  stats: getDefaultStats(nodeType),
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

wss.on("listening", () => {
  console.log(`listening on ${PORT}`);
});

function getDefaultStats(nodeType: string) {
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

  console.log(`[broadcastGameState]: ${JSON.stringify(stateMessage.data)}`);
  console.log(`[broadcastGameState]: ${JSON.stringify(wss.clients)}`);
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
