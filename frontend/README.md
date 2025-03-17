# Node Defenders - Frontend

Node Defenders is a blockchain-based tower defense game built on the Scroll network. Players defend their nodes against waves of enemies, stake tokens to upgrade their defenses, and earn rewards in the form of GODS and SOUL tokens.

## Features

- **Interactive Unity Game Integration**: Web-based gaming experience using NextJS and Unity WebGL
- **Wallet Integration**: Connect with your Ethereum wallet (MetaMask, WalletConnect, etc.)
- **Real-time Gameplay**: WebSocket connection to backend for game state synchronization
- **Blockchain Integration**: Stake tokens on nodes, mint rewards, and upgrade your defenses
- **Dual Token System**: Manage GODS and SOUL tokens for different upgrade paths
- **Wave-based Combat**: Defend against increasingly difficult waves of enemies
- **Node Management**: Place, upgrade, and customize different node types (Validator, Harvester, Defender, Attacker)
- **Responsive UI**: Modern, responsive design with cyberpunk-themed UI components

## Technology Stack

- **Framework**: Next.js
- **UI Components**:
  - Radix UI primitives
  - Custom cyberpunk-themed components
  - TailwindCSS for styling
- **Blockchain Integration**:
  - wagmi/viem for contract interactions
  - RainbowKit for wallet connections
  - Reown WalletKit for enhanced wallet functionality
- **Game Engine**: Unity (integrated via react-unity-webgl)
- **Real-time Communication**: WebSockets for backend synchronization
- **State Management**: React hooks and context

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Metamask or other Ethereum wallet
- Access to Scroll network (mainnet or testnet)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/node-defenders.git
   cd node-defenders
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:4000
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_GODS_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_SOUL_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_NODE_STAKING_ADDRESS=0x...
   NEXT_PUBLIC_SCROLL_RPC_URL=https://sepolia-rpc.scroll.io/
   ```

4. **Build and place the Unity WebGL build:**

   - If the Unity project is not included, you'll need to build it separately
   - Open the Unity project in Unity Editor
   - Go to File > Build Settings > Select WebGL platform
   - Configure the build to match the expected structure:
     ```
     /public/build/build.loader.js
     /public/build/build.data
     /public/build/build.framework.js
     /public/build/build.wasm
     ```
   - Click Build and select the `/public/build/` directory
   - The Unity game communicates directly with the backend via WebSockets

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Building for Production

```bash
npm run build
# or
yarn build
```

Then, start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

```
/
├── components/         # NextJS components
│   ├── cyberpunk/      # Custom cyberpunk-themed UI components
│   ├── dashboard/      # Game dashboard components
│   ├── ui/             # Base UI components
│   └── ...
├── lib/
│   ├── contracts/      # Contract ABIs and addresses
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── ...
├── public/
│   ├── unity-build/    # Compiled Unity WebGL build
│   └── ...
├── app/
│   ├── page.tsx        # Main game page
│   ├── layout.tsx      # Main app layout
│   └── ...
├── types/              # TypeScript type definitions
│   ├── socket.ts       # WebSocket message types
│   └── ...
└── ...
```

## Game Architecture

The Node Defenders frontend is built as a NextJS application with multiple communication paths:

1. **NextJS Frontend to Backend**:

   - WebSocket connection for real-time game state synchronization
   - API calls for token minting and other actions

2. **Unity WebGL to Backend**:

   - Direct WebSocket connection for game events (node placement, enemy events, etc.)
   - Independent from the NextJS frontend's connection

3. **NextJS Frontend to Blockchain**:

   - Direct interaction with smart contracts via wagmi/viem
   - Components like NodePool and GameControlCard make direct contract calls
   - Handles operations like token staking, unstaking, and reading contract state

4. **Backend to Blockchain**:
   - Handles authoritative operations that require server-side validation
   - Token distribution based on game achievements

```
┌───────────────────┐                       ┌─────────────────┐
│                   │       WebSockets      │                 │
│  NextJS Frontend  │<─────────────────────>│                 │
│                   │                       │                 │
└─┬───────┬─────────┘                       │                 │
  │       │                                 │ Node.js Backend │
  │       │ embeds                          │                 │
  │       ▼                                 │                 │
  │  ┌─────────────────┐     WebSockets     │                 │
  │  │                 │<─────────────────> │                 │
  │  │   Unity WebGL   │                    │                 │
  │  │                 │                    └────────┬────────┘
  │  └─────────────────┘                             │
  │                                                  │
  │                                                  │
  └────────────────────────┐       ┌─────────────────┘
                           ▼       ▼
                     ┌───────────────────┐
                     │                   │
                     │  Smart Contracts  │
                     │                   │
                     └───────────────────┘
```

## WebSocket Communication

The frontend communicates with the backend server using WebSockets for real-time game state updates. The `useSocket` hook encapsulates WebSocket connection logic and provides methods to:

- Send UI actions to the backend
- Receive game state updates
- Handle game events (node placement, wave start/end, etc.)

## Smart Contract Integration

The application interacts with the following smart contracts on the Scroll network through both the NextJS frontend components and the backend server:

### Frontend Smart Contract Integration

NextJS components directly interact with smart contracts using wagmi hooks:

- **NodePool.tsx**: Handles direct staking and unstaking of tokens on nodes

  - Uses `useReadContract` to read token balances, allowances, and node stake info
  - Uses `useWriteContract` to approve tokens, stake, unstake, and claim rewards
  - Uses `useWatchContractEvent` to listen for on-chain events like transfers, stakes, and claims

- **GameControlCard.tsx**: Manages token balances, minting, and game state
  - Uses `useReadContract` to read token balances
  - Uses `useWatchContractEvent` to listen for token transfers
  - Connects to TokenMinting hook for minting gameplay rewards

The contracts used include:

- **GODS Token**: ERC-20 token earned by defeating enemies
- **SOUL Token**: ERC-20 token earned by collecting resources
- **TokenDistributor**: Contract for minting tokens based on game achievements
- **NodeStaking**: Contract for staking tokens on nodes to enhance their capabilities

## Unity Integration

The game's visual component is built in Unity and integrated into the NextJS app using react-unity-webgl. The Unity game:

- Renders the game board, nodes, and enemies
- Handles core gameplay mechanics
- Contains its own WebSocket client that communicates directly with the backend server
- Manages state synchronization with the server (node placement, enemy events, etc.)
- Sends and receives real-time game events through WebSocket messages

### WebGL Build Requirements

The Unity WebGL build needs to produce the following files that should be placed in the `/public/build/` directory:

- `build.loader.js`
- `build.data`
- `build.framework.js`
- `build.wasm`

The Unity project includes custom WebSocket communication code (see `WebSocketManager.cs`) that establishes its own direct connection to the backend. This creates a dual-connection architecture where both the NextJS frontend and the Unity game independently communicate with the backend.

## Development

### Local Development Setup

1. Start the Node.js backend server (see backend README)
2. Start the frontend development server with `npm run dev`
3. Optionally, modify the Unity project and rebuild the WebGL bundle

### Adding New Node Types

To add a new node type:

1. Define the type in `useSocket.ts` (NodeType enum)
2. Add its properties to `NodePool.tsx` in the nodeTypeInfo object
3. Implement corresponding backend logic
4. Add Unity assets and behaviors

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the project's TypeScript conventions
- Use functional components and React hooks
- Document complex logic with comments

## Troubleshooting

### Common Issues

- **WebSocket Connection Failed**: Ensure the backend server is running and the NEXT_PUBLIC_WEBSOCKET_URL is correct
- **Wallet Connection Issues**: Check that you're connected to the correct network (Scroll Sepolia for testnet)
- **Unity Game Not Loading**: Verify that the Unity build files are properly placed in the `/public/build/` directory and named correctly according to the paths in UnityGameComponent.tsx
- **Unity WebSocket Connection Issues**: If the game loads but doesn't connect to the backend, check the WebSocket URL in WebSocketManager.cs (it may need to be updated to match your environment)
- **Token Transactions Failing**: Ensure you have sufficient funds for gas and that contract addresses are correct

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

## Acknowledgements

- Built for the Scroll Open Hackathon
- Inspired by traditional tower defense games
- UI design elements inspired by cyberpunk aesthetics
