// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NodeStaking
 * @dev A simple staking contract for a gaming application that allows users to stake
 * GODS and SOUL tokens on specific nodes. Rewards are calculated based on Block Percentage Yield (BPY).
 */
contract NodeStaking is ReentrancyGuard, Ownable {
    IERC20 public godsToken;
    IERC20 public soulToken;

    // Staking info per user per node
    mapping(address => mapping(string => uint256)) public godsStakes; // User -> NodeID -> GODS Amount
    mapping(address => mapping(string => uint256)) public soulStakes; // User -> NodeID -> SOUL Amount
    mapping(address => mapping(string => uint256)) public godsStakingBlocks; // User -> NodeID -> Block for GODS
    mapping(address => mapping(string => uint256)) public soulStakingBlocks; // User -> NodeID -> Block for SOUL

    // Reward configuration
    uint256 public blocksPerDay = 21600; // Approximate blocks per day on Scroll (~4s per block)
    uint256 public godsRewardRate = 1440; // 1% per minute
    uint256 public soulRewardRate = 1440;

    event Staked(
        address indexed user,
        string indexed nodeId,
        bool isGods,
        uint256 amount
    );
    event Unstaked(
        address indexed user,
        string indexed nodeId,
        bool isGods,
        uint256 amount,
        uint256 reward
    );
    event RewardsClaimed(
        address indexed user,
        string indexed nodeId,
        bool isGods,
        uint256 reward
    );

    constructor(address _godsToken, address _soulToken) Ownable(msg.sender) {
        godsToken = IERC20(_godsToken);
        soulToken = IERC20(_soulToken);
    }

    function stake(
        string memory nodeId,
        bool isGods,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        if (isGods) {
            // Calculate and handle any existing GODS rewards
            uint256 existingStake = godsStakes[msg.sender][nodeId];
            uint256 existingStakeBlock = godsStakingBlocks[msg.sender][nodeId];

            if (existingStake > 0) {
                uint256 blocksPassed = block.number - existingStakeBlock;
                uint256 rewards = calculateRewards(
                    existingStake,
                    blocksPassed,
                    godsRewardRate
                );

                // Compound rewards into stake
                existingStake += rewards;
            }

            godsStakes[msg.sender][nodeId] = existingStake + amount;
            godsStakingBlocks[msg.sender][nodeId] = block.number;

            require(
                godsToken.transferFrom(msg.sender, address(this), amount),
                "GODS transfer failed"
            );
        } else {
            uint256 existingStake = soulStakes[msg.sender][nodeId];
            uint256 existingStakeBlock = soulStakingBlocks[msg.sender][nodeId];

            if (existingStake > 0) {
                uint256 blocksPassed = block.number - existingStakeBlock;
                uint256 rewards = calculateRewards(
                    existingStake,
                    blocksPassed,
                    soulRewardRate
                );

                existingStake += rewards;
            }

            soulStakes[msg.sender][nodeId] = existingStake + amount;
            soulStakingBlocks[msg.sender][nodeId] = block.number;

            require(
                soulToken.transferFrom(msg.sender, address(this), amount),
                "SOUL transfer failed"
            );
        }

        emit Staked(msg.sender, nodeId, isGods, amount);
    }

    function unstake(
        string memory nodeId,
        bool isGods,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        if (isGods) {
            uint256 stakedAmount = godsStakes[msg.sender][nodeId];
            require(stakedAmount >= amount, "Not enough GODS staked");

            uint256 stakingBlock = godsStakingBlocks[msg.sender][nodeId];
            uint256 blocksPassed = block.number - stakingBlock;

            uint256 rewardShare = calculateRewards(
                amount,
                blocksPassed,
                godsRewardRate
            );

            godsStakes[msg.sender][nodeId] = stakedAmount - amount;
            if (stakedAmount - amount > 0) {
                godsStakingBlocks[msg.sender][nodeId] = block.number; // Reset block for remaining stake
            }

            require(
                godsToken.transfer(msg.sender, amount + rewardShare),
                "GODS transfer failed"
            );

            emit Unstaked(msg.sender, nodeId, true, amount, rewardShare);
        } else {
            uint256 stakedAmount = soulStakes[msg.sender][nodeId];
            require(stakedAmount >= amount, "Not enough SOUL staked");

            uint256 stakingBlock = soulStakingBlocks[msg.sender][nodeId];
            uint256 blocksPassed = block.number - stakingBlock;

            uint256 rewardShare = calculateRewards(
                amount,
                blocksPassed,
                soulRewardRate
            );

            soulStakes[msg.sender][nodeId] = stakedAmount - amount;
            if (stakedAmount - amount > 0) {
                soulStakingBlocks[msg.sender][nodeId] = block.number;
            }

            require(
                soulToken.transfer(msg.sender, amount + rewardShare),
                "SOUL transfer failed"
            );

            emit Unstaked(msg.sender, nodeId, false, amount, rewardShare);
        }
    }

    function claimRewards(
        string memory nodeId,
        bool isGods
    ) external nonReentrant {
        if (isGods) {
            uint256 stakedAmount = godsStakes[msg.sender][nodeId];
            require(stakedAmount > 0, "No GODS staked");

            uint256 stakingBlock = godsStakingBlocks[msg.sender][nodeId];
            uint256 blocksPassed = block.number - stakingBlock;

            uint256 rewards = calculateRewards(
                stakedAmount,
                blocksPassed,
                godsRewardRate
            );
            require(rewards > 0, "No rewards to claim");

            // Reset staking block
            godsStakingBlocks[msg.sender][nodeId] = block.number;

            // Transfer rewards
            require(
                godsToken.transfer(msg.sender, rewards),
                "GODS transfer failed"
            );

            emit RewardsClaimed(msg.sender, nodeId, true, rewards);
        } else {
            uint256 stakedAmount = soulStakes[msg.sender][nodeId];
            require(stakedAmount > 0, "No SOUL staked");

            uint256 stakingBlock = soulStakingBlocks[msg.sender][nodeId];
            uint256 blocksPassed = block.number - stakingBlock;

            uint256 rewards = calculateRewards(
                stakedAmount,
                blocksPassed,
                soulRewardRate
            );
            require(rewards > 0, "No rewards to claim");

            soulStakingBlocks[msg.sender][nodeId] = block.number;

            require(
                soulToken.transfer(msg.sender, rewards),
                "SOUL transfer failed"
            );

            emit RewardsClaimed(msg.sender, nodeId, false, rewards);
        }
    }

    function getPendingRewards(
        string memory nodeId,
        bool isGods
    ) external view returns (uint256) {
        if (isGods) {
            uint256 stakedAmount = godsStakes[msg.sender][nodeId];
            if (stakedAmount == 0) return 0;

            uint256 blocksPassed = block.number -
                godsStakingBlocks[msg.sender][nodeId];
            return calculateRewards(stakedAmount, blocksPassed, godsRewardRate);
        } else {
            uint256 stakedAmount = soulStakes[msg.sender][nodeId];
            if (stakedAmount == 0) return 0;

            uint256 blocksPassed = block.number -
                soulStakingBlocks[msg.sender][nodeId];
            return calculateRewards(stakedAmount, blocksPassed, soulRewardRate);
        }
    }

    function getNodeStakeInfo(
        string memory nodeId,
        address user
    )
        external
        view
        returns (
            uint256 godsAmount,
            uint256 godsStakeBlock,
            uint256 soulAmount,
            uint256 soulStakeBlock
        )
    {
        return (
            godsStakes[user][nodeId],
            godsStakingBlocks[user][nodeId],
            soulStakes[user][nodeId],
            soulStakingBlocks[user][nodeId]
        );
    }

    function calculateRewards(
        uint256 amount,
        uint256 blocksPassed,
        uint256 rewardRate
    ) internal view returns (uint256) {
        // Daily rate * (blocks passed / blocks per day) * amount / 100
        return (amount * blocksPassed * rewardRate) / (blocksPerDay * 100);
    }

    function updateRewardRates(
        uint256 _godsRewardRate,
        uint256 _soulRewardRate
    ) external onlyOwner {
        godsRewardRate = _godsRewardRate;
        soulRewardRate = _soulRewardRate;
    }

    function updateBlocksPerDay(uint256 _blocksPerDay) external onlyOwner {
        require(_blocksPerDay > 0, "Blocks per day must be greater than 0");
        blocksPerDay = _blocksPerDay;
    }

    /**
     * @dev Emergency withdraw tokens (for owner only, in case of issues)
     * @param _token Address of token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address _token,
        uint256 amount
    ) external onlyOwner {
        IERC20 token = IERC20(_token);
        require(token.transfer(owner(), amount), "Transfer failed");
    }
}
