import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket";
import { setupSocketHandlers } from "./services/socketHandler";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server with typed events
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    // origin: process.env.FRONTEND_URL || "http://localhost:3000",
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Set up Socket.IO event handlers
setupSocketHandlers(io);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint to see current game states
app.get("/game-states", (req, res) => {
  // This isn't type-safe but it's just for debugging
  const states = (global as any).gameStates || {};
  res.status(200).json(states);
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Socket.IO server listening on port ${PORT}`);
});
