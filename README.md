# Node Defenders

A DeFi tower defense game built on Scroll blockchain where players deploy yield-generating towers to defend against waves of enemies.

## Development Status

Currently in Phase 1 of development:

- Next.js frontend with DOM-based game renderer
- Smart contract development
- DeFi features integration

Phase 2 will include Unity game integration.

## Tech Stack

- Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- Blockchain: Scroll, Solidity
- Future: Unity WebGL

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
app/
  lib/
    types/      # Core type definitions
    game/       # Game engine and logic
    hooks/      # Custom React hooks
  components/
    game/       # Game rendering components
    dashboard/  # DeFi dashboard components
```

## Game Mechanics

- Deploy different types of towers (Validator, LP, Lending, Yield)
- Each tower generates yield based on its type and level
- Defend against enemy waves while managing resources
- Upgrade towers to increase effectiveness and yield

## Smart Contracts (WIP)

- Tower NFTs
- Yield generation
- Upgrade system
- Game state verification

## Contributing

Currently in active development. Contributions will be welcome after initial alpha release.

## License

Apache-2.0
