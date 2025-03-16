# Dual Token System

A prototype system for minting two different ERC20 tokens ($SOUL and $GODS) to users based on their eligibility.

## Overview

This system enables users to mint variable amounts of two different tokens. The amounts are determined by the backend and can be minted either directly by users or through an authorized backend.

## Components

### Smart Contracts

- **SoulToken**: ERC20 token implementing the $SOUL token
- **GodsToken**: ERC20 token implementing the $GODS token
- **TokenDistributor**: Central contract that handles minting of both tokens

### Frontend

- Connects to user wallet
- Displays token amounts eligible for minting
- Provides interface for minting tokens
- Unity integration for gameplay

### Backend

- Determines token eligibility amounts
- Optional: Handles authorized minting to save users gas fees

## Quick Start

1. Deploy smart contracts to Scroll network

   ```
   npx hardhat run scripts/deploy.js --network scroll
   ```

2. Set up your environment variables

   ```
   DISTRIBUTOR_ADDRESS=0x...
   SOUL_TOKEN_ADDRESS=0x...
   GODS_TOKEN_ADDRESS=0x...
   PRIVATE_KEY=0x... (for backend only)
   RPC_URL=https://...
   ```

3. Start the backend

   ```
   npm run start:server
   ```

4. Run the frontend
   ```
   npm run dev
   ```

## Minting Flow

1. User connects wallet
2. Backend determines token amounts based on gameplay/eligibility
3. User initiates minting through the UI
4. Tokens are minted directly to the user's wallet

## Development Notes

- This is a prototype implementation
- For production, add additional security measures:
  - Rate limiting
  - Signature verification
  - Event logging
  - Access controls

## License

MIT
