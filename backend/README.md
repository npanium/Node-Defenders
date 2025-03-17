# Game Server - WebSocket & HTTP API

This Node.js server provides real-time game state synchronization via WebSockets and token minting capabilities through a REST API. The server is designed to work with a blockchain-based tower defense game featuring the GODS and SOUL token system.

## Features

- **Real-time Game State Sync**: WebSocket-based game state broadcasting to all connected clients
- **Node Management**: Create, update, and manage game nodes with unique properties
- **Token Distribution**: Integration with the TokenDistributor smart contract to mint tokens
- **Game Mechanics**: Support for waves, enemies, health tracking, and currency

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Ethereum wallet with private key (for token distribution)
- Deployed TokenDistributor contract

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
TOKEN_DISTRIBUTOR_ADDRESS=0x... # Address of the deployed TokenDistributor contract
DISTRIBUTOR_PRIVATE_KEY=your_private_key_here # Private key with permissions to call authorizedMint
SCROLL_RPC_URL=https://sepolia-rpc.scroll.io/ # RPC URL for the blockchain (Scroll by default)
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   or
   ```bash
   yarn start
   ```

## Server Endpoints

### HTTP Endpoints

- **GET `/api/game-state`**: Fetch current game state
- **POST `/api/mint-tokens`**: Mint GODS and SOUL tokens for an address
  - Request body:
    ```json
    {
      "address": "0x123...", // Recipient address
      "soulAmount": 10, // Amount of SOUL tokens to mint
      "godsAmount": 10 // Amount of GODS tokens to mint
    }
    ```

### WebSocket Messages

#### Incoming Messages

The server handles the following message types from clients:

- `node_placed`: Place a new node in the game
- `node_destroyed`: Remove an existing node
- `node_selected`: Select a node to focus on
- `node_stats_update`: Update a node's stats
- `ui_action`: Handle UI interactions (stake tokens, heal nodes)
- `node_health_update`: Update a node's health
- `currency_update`: Update game currency
- `wave_countdown`: Start countdown to next wave
- `enemy_killed`: Register enemy defeat
- `wave_started`: Start a new wave
- `game_stats`: Update overall game stats
- `game_won`: Mark game as won
- `game_reset`: Reset game state

#### Outgoing Messages

The server sends these messages to clients:

- `state_update`: Full game state
- `action_confirmed`: Confirmation of client actions
- `node_stats_update`: Updates to node statistics
- `node_health_update`: Updates to node health
- `currency_update`: Updates to game currency
- `wave_countdown`: Wave countdown information
- `enemy_destroyed`: Enemy defeat notification
- `wave_started`: Wave start notification
- `game_over`: Game over notification
- `game_won`: Game win notification
- `game_reset`: Game reset notification

## Game State Structure

The game state includes:

- `totalNodesPlaced`: Count of nodes
- `nodeTypes`: Distribution of node types
- `nodes`: Map of node objects with IDs as keys
- `selectedNodeId`: Currently selected node
- `currency`: Current game currency
- `currentWave`/`maxWaves`: Wave tracking
- `enemiesInWave`/`enemiesKilled`: Enemy tracking
- `mainNodeHealth`: Health status of main node
- `isCountingDown`: Wave countdown status
- `lastUpdated`: Timestamp of last update

## Node Types and Default Stats

The server supports various node types with different default statistics:

- **Validator**: Balanced node with high efficiency
- **Harvester**: Resource-focused with highest efficiency
- **Defender**: Range-focused defensive node
- **Attacker**: Damage-focused offensive node

## Blockchain Integration

The server integrates with the Ethereum-compatible blockchain (Scroll) via:

- `ethers.js` for blockchain interaction
- TokenDistributor contract for token minting
- Wallet signing for authorized transactions

## Error Handling

- WebSocket message validation
- Transaction failure handling
- Client connection/disconnection management
- Duplicate action prevention

## Production Deployment

For production deployment, consider:

1. Using a process manager like PM2
2. Setting up SSL for secure WebSocket connections
3. Implementing rate limiting
4. Using a more robust database for game state persistence

## Limitations and Shortcomings

The current implementation has several limitations to be aware of:

1. **In-Memory State**: Game state is stored in memory and will be lost if the server restarts. There's no persistence layer.

2. **Scalability Concerns**: The WebSocket broadcasting approach may not scale well with a large number of concurrent players.

3. **Error Recovery**: Limited mechanisms for recovery from blockchain transaction failures.

4. **Security**: No authentication is implemented for WebSocket connections, making it vulnerable to unauthorized access.

5. **Transaction Management**: No queuing system for blockchain transactions, which could lead to nonce issues under heavy load.

6. **Testing**: Lacks comprehensive test coverage for edge cases and failure scenarios.

7. **Monitoring**: No built-in metrics or monitoring for server health and performance.

8. **Rate Limiting**: No protection against excessive requests from clients.

## License

Apache License 2.0

```
Copyright 2025

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
