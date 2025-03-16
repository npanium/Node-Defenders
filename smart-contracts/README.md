# Dual Token System Smart Contracts

This repository contains the smart contracts for a dual token system consisting of SOUL and GODS tokens, with a TokenDistributor contract for managing token minting and distribution.

## Contracts Overview

### SoulToken.sol

A standard ERC20 token with minting functionality, controlled by the owner.

- Symbol: SOUL
- Decimals: 18 (default for ERC20)
- Minting: Restricted to the contract owner

### GodsToken.sol

A standard ERC20 token with minting functionality, controlled by the owner.

- Symbol: GODS
- Decimals: 18 (default for ERC20)
- Minting: Restricted to the contract owner

### TokenDistributor.sol

A central distribution contract that can mint both SOUL and GODS tokens.

- Controls minting of both tokens once ownership is transferred
- Optional mint fee mechanism included
- Owner-only authorized minting function
- Public minting function with optional fee

## Deployment Flow

1. Deploy SoulToken with your address as the `initialOwner`
2. Deploy GodsToken with your address as the `initialOwner`
3. Deploy TokenDistributor with the addresses of the deployed SoulToken and GodsToken contracts
4. Transfer ownership of both SoulToken and GodsToken to the TokenDistributor address
5. Now the TokenDistributor can mint tokens for users

## Critical Step: Ownership Transfer

⚠️ **IMPORTANT**: Before the TokenDistributor can mint any tokens, you MUST transfer ownership of both token contracts to the TokenDistributor contract.

The `mint` functions on both SoulToken and GodsToken have the `onlyOwner` modifier, meaning only the contract owner can call them. If you don't transfer ownership to the TokenDistributor, any calls to `mintTokens` or `authorizedMint` will revert.

### Steps to Transfer Ownership:

1. After deploying all contracts, call the `transferOwnership` function on both SoulToken and GodsToken
2. Use the address of your deployed TokenDistributor as the new owner

```solidity
// Example of transferring ownership
soulToken.transferOwnership(tokenDistributorAddress);
godsToken.transferOwnership(tokenDistributorAddress);
```

## Deployment Instructions

### Using Remix

1. Load all three contract files into Remix
2. Compile each contract
3. Deploy in the following order:
   - Deploy SoulToken (provide your address as initialOwner)
   - Deploy GodsToken (provide your address as initialOwner)
   - Deploy TokenDistributor (provide the addresses of the deployed token contracts)
4. Transfer ownership:
   - Select SoulToken in Remix, call `transferOwnership` with TokenDistributor's address
   - Select GodsToken in Remix, call `transferOwnership` with TokenDistributor's address
5. Now you can use the TokenDistributor to mint tokens

### Using Hardhat or Truffle

Similar deployment scripts can be created for Hardhat or Truffle. Ensure you follow the same sequence: deploy tokens, deploy distributor, transfer ownership.

## Using the TokenDistributor

### For Owners

As the owner of the TokenDistributor, you can:

- Call `authorizedMint(recipient, soulAmount, godsAmount)` to mint specific amounts of both tokens to a recipient
- Call `setMintFee(newFee)` to set a fee for public minting
- Call `withdraw()` to withdraw any ETH collected from mint fees

### For Users

Users can:

- Call `mintTokens(recipient, soulAmount, godsAmount)` to mint tokens
- Pay the required fee (if set by the owner)

## Contract Compatibility

- Solidity Version: ^0.8.22
- OpenZeppelin Contracts: v5.0.0 compatible
- EVM Compatible: These contracts can be deployed on any EVM-compatible chain including Ethereum Mainnet, Sepolia, Scroll, Arbitrum, etc.

## Testing

Before deploying to mainnet, it's recommended to:

1. Test on Sepolia or another testnet
2. Verify all contracts on Etherscan (or the equivalent block explorer)
3. Test the full token minting flow including ownership transfer

## Gas Optimization

These contracts are optimized for clarity rather than gas efficiency. For high-volume applications, consider:

- Removing optional features like `hasMinted` tracking if not needed
- Optimizing the mint functions for batch processing

## License

These contracts are under the MIT License.
