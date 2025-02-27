import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import http from "http";
import {
  ActionConfirmedMessage,
  ClientMessage,
  GameState,
  StateUpdateMessage,
} from "./types";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const HTTP_PORT = 3000;

const gameState: GameState = {
  totalNodesPlaced: 0,
  nodeTypes: {}, // Track different types of nodes
  lastUpdated: new Date(),
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

        gameState.lastUpdated = new Date();

        broadcastGameState();

        // Send acknowledgment back to the sender
        const response: ActionConfirmedMessage = {
          type: "action_confirmed",
          action: "node_placed",
          success: true,
          newTotal: gameState.totalNodesPlaced,
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
      }
      // Handle plain text messages (legacy support)
      else if ("content" in message && message.content) {
        console.log("Text message received:", message.content);

        // Check if it's a node placement message
        if (message.content.includes("Node created")) {
          gameState.totalNodesPlaced++;
          gameState.lastUpdated = new Date();

          broadcastGameState();
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
  console.log("listening on 8080");
});

function broadcastGameState(): void {
  const stateMessage: StateUpdateMessage = {
    type: "state_update",
    data: gameState,
  };

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
