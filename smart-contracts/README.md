# Dual Token System Smart Contracts

This repository contains the smart contracts for a dual token system consisting of SOUL and GODS tokens, with a TokenDistributor contract for managing token minting and distribution, and a NodeStaking contract for staking functionality.

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

### NodeStaking.sol

A staking contract that allows users to stake GODS and SOUL tokens on specific nodes.

- Users can stake GODS and SOUL tokens on specific nodes
- Rewards are calculated based on Block Percentage Yield (BPY)
- Users can unstake tokens and claim rewards
- Owner can update reward rates and blocks per day parameter

## Deployment Flow

1. Deploy SoulToken with your address as the `initialOwner`
2. Deploy GodsToken with your address as the `initialOwner`
3. Deploy TokenDistributor with the addresses of the deployed SoulToken and GodsToken contracts
4. Deploy NodeStaking with the addresses of the deployed SoulToken and GodsToken contracts
5. Transfer ownership of both SoulToken and GodsToken to the TokenDistributor address
6. **Fund the NodeStaking contract with both GODS and SOUL tokens for reward payments**
7. Now the TokenDistributor can mint tokens for users and the NodeStaking contract can handle staking operations

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

## Critical Step: Funding the Staking Contract

⚠️ **IMPORTANT**: The NodeStaking contract must hold a sufficient balance of both GODS and SOUL tokens to pay out rewards to stakers. Without this balance, reward claiming transactions will revert.

### Steps to Fund the Staking Contract:

1. After deploying all contracts and minting tokens, transfer an adequate amount of both tokens to the NodeStaking contract address
2. This can be done through the TokenDistributor's `authorizedMint` function or through regular ERC20 `transfer` calls

```solidity
// Example of minting tokens directly to the staking contract
tokenDistributor.authorizedMint(nodeStakingAddress, soulAmount, godsAmount);

// Alternative: transfer existing tokens
godsToken.transfer(nodeStakingAddress, godsAmount);
soulToken.transfer(nodeStakingAddress, soulAmount);
```

## Deployment Instructions

### Using Remix

1. Load all contract files into Remix
2. Compile each contract
3. Deploy in the following order:
   - Deploy SoulToken (provide your address as initialOwner)
   - Deploy GodsToken (provide your address as initialOwner)
   - Deploy TokenDistributor (provide the addresses of the deployed token contracts)
   - Deploy NodeStaking (provide the addresses of the deployed token contracts)
4. Transfer ownership:
   - Select SoulToken in Remix, call `transferOwnership` with TokenDistributor's address
   - Select GodsToken in Remix, call `transferOwnership` with TokenDistributor's address
5. Fund the NodeStaking contract with tokens:
   - Use TokenDistributor to mint tokens directly to the NodeStaking contract, or
   - Transfer existing tokens to the NodeStaking contract address
6. Now you can use the TokenDistributor to mint tokens and the NodeStaking contract for staking operations

### Using Hardhat or Truffle

Similar deployment scripts can be created for Hardhat or Truffle. Ensure you follow the same sequence: deploy tokens, deploy distributor and staking contracts, transfer ownership, fund the staking contract.

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

## Using the NodeStaking Contract

### For Owners

As the owner of the NodeStaking contract, you can:

- Call `updateRewardRates(godsRewardRate, soulRewardRate)` to adjust the reward rates
- Call `updateBlocksPerDay(blocksPerDay)` to adjust the blocks per day parameter used in reward calculations
- Call `emergencyWithdraw(tokenAddress, amount)` to withdraw tokens in case of an emergency

### For Users

Users can:

- Call `stake(nodeId, isGods, amount)` to stake tokens on a specific node
- Call `unstake(nodeId, isGods, amount)` to unstake tokens and receive rewards
- Call `claimRewards(nodeId, isGods)` to claim rewards without unstaking
- Call `getPendingRewards(nodeId, isGods)` to check pending rewards
- Call `getNodeStakeInfo(nodeId, userAddress)` to get detailed staking information

## Contract Compatibility

- Solidity Version: ^0.8.20
- OpenZeppelin Contracts: v5.0.0 compatible
- EVM Compatible: These contracts can be deployed on any EVM-compatible chain including Ethereum Mainnet, Sepolia, Scroll, Arbitrum, etc.

## Testing

Before deploying to mainnet, it's recommended to:

1. Test on Sepolia or another testnet
2. Verify all contracts on Etherscan (or the equivalent block explorer)
3. Test the full token minting flow including ownership transfer
4. Test the staking and reward mechanisms with different parameters

## Gas Optimization

These contracts are optimized for clarity rather than gas efficiency. For high-volume applications, consider:

- Removing optional features like `hasMinted` tracking if not needed
- Optimizing the mint functions for batch processing

## License

These contracts are under the MIT License.
