import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Droplets,
  Zap,
  Target,
  Swords,
  Plus,
  Minus,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CyberpunkNeonButton from "./cyberpunk/CyberpunkNeonButton";
import useSocket from "@/lib/hooks/useSocket";
import {
  useAccount,
  useReadContract,
  useWatchContractEvent,
  useWalletClient,
  useSimulateContract,
  useWriteContract,
} from "wagmi";
import { abi as NodeStakingABI } from "@/lib/contracts/NodeStaking.sol/NodeStaking.json"; // Import the ABI
import { abi as erc20ABI } from "@/lib/contracts/GodsToken.sol/GodsToken.json"; // Import the ABI

export type NodeType = "validator" | "harvester" | "defender" | "attacker";

interface NodeStats {
  damage: number;
  range: number;
  speed: number;
  efficiency: number;
}

interface TokenBalance {
  gods: number;
  soul: number;
}

interface NodePoolCardProps {
  nodeId: string;
  nodeType: NodeType;
  poolSize: number;
  stakedTokens: TokenBalance;
  nodeStats: NodeStats;
  onStake: (tokenType: "gods" | "soul", amount: number) => void;
  onUnstake: (tokenType: "gods" | "soul", amount: number) => void;
  className?: string;
  // Token contract addresses
  godsTokenAddress: string;
  soulTokenAddress: string;
  // Add the staking contract address
  nodeStakingAddress: string;
}

const nodeTypeInfo = {
  validator: {
    title: "Validator Node",
    description: "Validates transactions and secures the network",
    icon: Droplets,
    color: "cyan",
    primaryStat: "efficiency",
  },
  harvester: {
    title: "Harvester Node",
    description: "Extracts resources from the blockchain",
    icon: Zap,
    color: "green",
    primaryStat: "efficiency",
  },
  defender: {
    title: "Defender Node",
    description: "Protects against network attacks",
    icon: Target,
    color: "purple",
    primaryStat: "range",
  },
  attacker: {
    title: "Attacker Node",
    description: "Launches offensive measures against enemies",
    icon: Swords,
    color: "pink",
    primaryStat: "damage",
  },
};

export const NodePool: React.FC<NodePoolCardProps> = ({
  nodeId,
  nodeType,
  poolSize,
  stakedTokens,
  nodeStats,
  onStake,
  onUnstake,
  className,
  godsTokenAddress,
  soulTokenAddress,
  nodeStakingAddress,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [selectedToken, setSelectedToken] = useState<"gods" | "soul">("gods");
  const [isHovering, setIsHovering] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [nodeStakedTokens, setNodeStakedTokens] = useState({
    gods: 0,
    soul: 0,
  });
  const [pendingRewards, setPendingRewards] = useState({ gods: 0, soul: 0 });
  const { sendUIAction } = useSocket();

  const info = nodeTypeInfo[nodeType];

  // Use wagmi hooks for wallet connection and balances
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Get token balances
  const { data: godsBalance, refetch: refetchGodsBalance } = useReadContract({
    address: godsTokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  const { data: soulBalance, refetch: refetchSoulBalance } = useReadContract({
    address: soulTokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Get token allowances for staking contract
  const { data: godsAllowance, refetch: refetchGodsAllowance } =
    useReadContract({
      address: godsTokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: "allowance",
      args: [
        address || "0x0000000000000000000000000000000000000000",
        nodeStakingAddress as `0x${string}`,
      ],
    });

  const { data: soulAllowance, refetch: refetchSoulAllowance } =
    useReadContract({
      address: soulTokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: "allowance",
      args: [
        address || "0x0000000000000000000000000000000000000000",
        nodeStakingAddress as `0x${string}`,
      ],
    });

  // Convert allowances from wei to ether
  const formattedGodsAllowance = godsAllowance
    ? parseFloat(Number(godsAllowance) / 10 ** 18 + "")
    : 0;

  const formattedSoulAllowance = soulAllowance
    ? parseFloat(Number(soulAllowance) / 10 ** 18 + "")
    : 0;

  // Get staked token info from the contract
  const { data: nodeStakeInfo, refetch: refetchNodeStakeInfo } =
    useReadContract({
      address: nodeStakingAddress as `0x${string}`,
      abi: NodeStakingABI,
      functionName: "getNodeStakeInfo",
      args: [nodeId, address || "0x0000000000000000000000000000000000000000"],
    });

  // Get pending rewards from the contract
  const { data: godsPendingRewards, refetch: refetchGodsPendingRewards } =
    useReadContract({
      address: nodeStakingAddress as `0x${string}`,
      abi: NodeStakingABI,
      functionName: "getPendingRewards",
      args: [nodeId, true], // true for GODS token
    });

  const { data: soulPendingRewards, refetch: refetchSoulPendingRewards } =
    useReadContract({
      address: nodeStakingAddress as `0x${string}`,
      abi: NodeStakingABI,
      functionName: "getPendingRewards",
      args: [nodeId, false], // false for SOUL token
    });

  // Contract write functions for approving, staking and unstaking
  const {
    writeContractAsync: approveGods,
    isPending: isApproveGodsPending,
    isError: isApproveGodsError,
    error: approveGodsError,
  } = useWriteContract();

  const { writeContractAsync: approveSoul } = useWriteContract();

  const { writeContractAsync: stakeTokens } = useWriteContract();

  const { writeContractAsync: unstakeTokens } = useWriteContract();

  const { writeContractAsync: claimRewards } = useWriteContract();

  // Watch for Transfer events involving the current user for GODS token
  useWatchContractEvent({
    address: godsTokenAddress as `0x${string}`,
    abi: erc20ABI,
    eventName: "Transfer",
    args: [undefined, address],
    onLogs() {
      // Refresh GODS balance when tokens are sent to user
      refetchGodsBalance();
    },
    enabled: isConnected && !!address && !!godsTokenAddress,
  });

  // Watch for Transfer events from the user for GODS token (for staking)
  useWatchContractEvent({
    address: godsTokenAddress as `0x${string}`,
    abi: erc20ABI,
    eventName: "Transfer",
    args: [address, undefined],
    onLogs() {
      // Refresh GODS balance when user sends tokens
      refetchGodsBalance();
    },
    enabled: isConnected && !!address && !!godsTokenAddress,
  });

  // Watch for Transfer events involving the current user for SOUL token
  useWatchContractEvent({
    address: soulTokenAddress as `0x${string}`,
    abi: erc20ABI,
    eventName: "Transfer",
    args: [undefined, address],
    onLogs() {
      // Refresh SOUL balance when tokens are sent to user
      refetchSoulBalance();
    },
    enabled: isConnected && !!address && !!soulTokenAddress,
  });

  // Watch for Transfer events from the user for SOUL token (for staking)
  useWatchContractEvent({
    address: soulTokenAddress as `0x${string}`,
    abi: erc20ABI,
    eventName: "Transfer",
    args: [address, undefined],
    onLogs() {
      // Refresh SOUL balance when user sends tokens
      refetchSoulBalance();
    },
    enabled: isConnected && !!address && !!soulTokenAddress,
  });

  // Watch for Staked events for this node and user
  useWatchContractEvent({
    address: nodeStakingAddress as `0x${string}`,
    abi: NodeStakingABI,
    eventName: "Staked",
    args: [address, nodeId],
    onLogs() {
      // Refresh node stake info and balances
      refetchNodeStakeInfo();
      refetchGodsBalance();
      refetchSoulBalance();
      refetchGodsPendingRewards();
      refetchSoulPendingRewards();
    },
    enabled: isConnected && !!address && !!nodeStakingAddress,
  });

  // Watch for Unstaked events for this node and user
  useWatchContractEvent({
    address: nodeStakingAddress as `0x${string}`,
    abi: NodeStakingABI,
    eventName: "Unstaked",
    args: [address, nodeId],
    onLogs() {
      // Refresh node stake info and balances
      refetchNodeStakeInfo();
      refetchGodsBalance();
      refetchSoulBalance();
      refetchGodsPendingRewards();
      refetchSoulPendingRewards();
    },
    enabled: isConnected && !!address && !!nodeStakingAddress,
  });

  // Watch for RewardsClaimed events for this node and user
  useWatchContractEvent({
    address: nodeStakingAddress as `0x${string}`,
    abi: NodeStakingABI,
    eventName: "RewardsClaimed",
    args: [address, nodeId],
    onLogs() {
      // Refresh node stake info, rewards and balances
      refetchNodeStakeInfo();
      refetchGodsBalance();
      refetchSoulBalance();
      refetchGodsPendingRewards();
      refetchSoulPendingRewards();
    },
    enabled: isConnected && !!address && !!nodeStakingAddress,
  });

  // Convert token balances from wei to ether (formatted values)
  const formattedGodsBalance = godsBalance
    ? parseFloat(Number(godsBalance) / 10 ** 18 + "")
    : 0;

  const formattedSoulBalance = soulBalance
    ? parseFloat(Number(soulBalance) / 10 ** 18 + "")
    : 0;

  // Update staked tokens state when nodeStakeInfo changes
  useEffect(() => {
    if (nodeStakeInfo) {
      const [godsAmount, , soulAmount] = nodeStakeInfo as unknown as [
        bigint,
        bigint,
        bigint,
        bigint
      ];

      setNodeStakedTokens({
        gods: parseFloat(Number(godsAmount) / 10 ** 18 + ""),
        soul: parseFloat(Number(soulAmount) / 10 ** 18 + ""),
      });
    }
  }, [nodeStakeInfo]);

  // Update pending rewards state when rewards data changes
  useEffect(() => {
    const godsRewards = godsPendingRewards
      ? parseFloat(Number(godsPendingRewards) / 10 ** 18 + "")
      : 0;

    const soulRewards = soulPendingRewards
      ? parseFloat(Number(soulPendingRewards) / 10 ** 18 + "")
      : 0;

    setPendingRewards({
      gods: godsRewards,
      soul: soulRewards,
    });
  }, [godsPendingRewards, soulPendingRewards]);

  // Fetch all contract data on mount and when relevant states change
  useEffect(() => {
    if (isConnected && address) {
      refreshContractData();
    }
  }, [isConnected, address, nodeId]);

  // Effect to trigger pulse when stats change
  useEffect(() => {
    setPulseEffect(true);
    const timer = setTimeout(() => setPulseEffect(false), 2000);
    return () => clearTimeout(timer);
  }, [nodeStats]);

  // Refresh all contract data
  const refreshContractData = () => {
    if (isConnected) {
      refetchGodsBalance();
      refetchSoulBalance();
      refetchGodsAllowance();
      refetchSoulAllowance();
      refetchNodeStakeInfo();
      refetchGodsPendingRewards();
      refetchSoulPendingRewards();
    }
  };

  // Calculate stat percentage for display
  const calculateStatPercentage = (value: number) => {
    return Math.min(Math.max(value * 10, 0), 100);
  };

  // Format numbers to look cleaner
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Get available token balance based on selection
  const getAvailableBalance = (tokenType: "gods" | "soul") => {
    if (!isConnected) return 0;
    return tokenType === "gods" ? formattedGodsBalance : formattedSoulBalance;
  };

  // Check if allowance is sufficient for staking
  const hasAllowance = () => {
    const amountInWei = stakeAmount * 10 ** 18;
    if (selectedToken === "gods") {
      return formattedGodsAllowance >= stakeAmount;
    } else {
      return formattedSoulAllowance >= stakeAmount;
    }
  };

  // Handle token approval for staking
  const handleApprove = async () => {
    if (!isConnected || isApproving) return;

    try {
      setIsApproving(true);
      const amountToApprove = BigInt(stakeAmount * 10 ** 18 * 2);
      console.log(
        "[handleApprove] amountToApprove: ",
        amountToApprove.toString()
      );

      if (selectedToken === "gods") {
        console.log("[handleApprove] GODS");

        const result = await approveGods({
          address: godsTokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: "approve",
          args: [nodeStakingAddress as `0x${string}`, amountToApprove],
        });

        console.log("[handleApprove] transaction hash:", result);
      } else {
        const result = await approveSoul({
          address: soulTokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: "approve",
          args: [nodeStakingAddress as `0x${string}`, amountToApprove],
        });
        console.log("[handleApprove] transaction hash:", result);
      }

      // Wait a moment and then refresh the allowances
      setTimeout(() => {
        selectedToken === "gods"
          ? refetchGodsAllowance()
          : refetchSoulAllowance();
        setIsApproving(false);
      }, 2000);
    } catch (error) {
      console.error("Approval error:", error);
      setIsApproving(false);
    }
  };

  // Handle staking with contract integration
  const handleStake = async () => {
    if (!isConnected || isStaking) return;

    // Check if user has enough balance
    const availableBalance = getAvailableBalance(selectedToken);
    if (availableBalance < stakeAmount) {
      alert(`Insufficient ${selectedToken.toUpperCase()} balance`);
      return;
    }

    // Check if we have enough allowance
    if (!hasAllowance()) {
      await handleApprove();
      return;
    }

    try {
      setIsStaking(true);
      const amountInWei = BigInt(stakeAmount * 10 ** 18);
      const isGods = selectedToken === "gods";

      console.log("[handleStake] noddeId: ", nodeId);
      // Call the contract's stake function
      const result = await stakeTokens({
        address: nodeStakingAddress as `0x${string}`,
        abi: NodeStakingABI,
        functionName: "stake",
        args: [nodeId, isGods, amountInWei],
      });
      console.log("[handleStake] transaction hash:", result);
      // Local state update (for UI responsiveness)
      onStake(selectedToken, stakeAmount);

      // Send to backend for synchronization with the game
      sendUIAction("stake_tokens", {
        nodeId,
        tokenType: selectedToken,
        amount: stakeAmount,
      });

      // Refresh all data after staking
      setTimeout(() => {
        refreshContractData();
        setIsStaking(false);
      }, 2000);
    } catch (error) {
      console.error("Staking error:", error);
      setIsStaking(false);
    }
  };

  // Handle unstaking with contract integration
  const handleUnstake = async () => {
    if (!isConnected || isUnstaking) return;

    // Only unstake if we have tokens staked
    if (nodeStakedTokens[selectedToken] < stakeAmount) {
      alert(`Not enough ${selectedToken.toUpperCase()} staked`);
      return;
    }

    try {
      setIsUnstaking(true);
      const amountInWei = BigInt(stakeAmount * 10 ** 18);
      const isGods = selectedToken === "gods";

      // Call the contract's unstake function
      await unstakeTokens({
        address: nodeStakingAddress as `0x${string}`,
        abi: NodeStakingABI,
        functionName: "unstake",
        args: [nodeId, isGods, amountInWei],
      });

      // Local state update (for UI responsiveness)
      onUnstake(selectedToken, stakeAmount);

      // Send to backend for synchronization with the game
      sendUIAction("unstake_tokens", {
        nodeId,
        tokenType: selectedToken,
        amount: stakeAmount,
      });

      // Refresh all data after unstaking
      setTimeout(() => {
        refreshContractData();
        setIsUnstaking(false);
      }, 2000);
    } catch (error) {
      console.error("Unstaking error:", error);
      setIsUnstaking(false);
    }
  };

  // Handle claiming rewards
  const handleClaimRewards = async (tokenType: "gods" | "soul") => {
    if (!isConnected) return;

    try {
      const isGods = tokenType === "gods";

      // Call the contract's claimRewards function
      await claimRewards({
        address: nodeStakingAddress as `0x${string}`,
        abi: NodeStakingABI,
        functionName: "claimRewards",
        args: [nodeId, isGods],
      });

      // Refresh all data after claiming
      setTimeout(() => {
        refreshContractData();
      }, 2000);
    } catch (error) {
      console.error(`Claiming ${tokenType} rewards error:`, error);
    }
  };

  // Node Icon Component
  const NodeIcon = info.icon;

  return (
    <div>
      <div className="space-y-4">
        {/* Node visualization - animated container */}
        <div
          className={cn(
            "relative h-32 rounded-lg border border-slate-700/50 bg-slate-900/50 overflow-hidden transition-all duration-300",
            pulseEffect && "animate-pulse"
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Circuit background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%2332E0FF' stroke-width='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "30px 30px",
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  `bg-${info.color}-900/30 border border-${info.color}-500/50`,
                  isHovering && "shadow-lg"
                )}
              >
                <NodeIcon className={`w-10 h-10 text-${info.color}-400`} />

                <div
                  className={cn(
                    "absolute -inset-4 rounded-full border-2 border-dashed opacity-30",
                    `border-${info.color}-500`
                  )}
                  style={{
                    transform: `scale(${1 + nodeStats.range * 0.2})`,
                    transition: "transform 0.5s ease-out",
                  }}
                ></div>

                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full bg-${info.color}-400`}
                    style={{
                      animation: `
                        orbit ${2 / nodeStats.speed}s linear infinite,
                        pulse-glow 1.5s ease-in-out infinite
                      `,
                      animationDelay: `
                        ${i * (12 / nodeStats.speed / 6)}s,
                        ${i * 0.2}s
                      `,
                      transformOrigin: "center",
                      boxShadow: `0 0 6px var(--${info.color}-400), 0 0 10px var(--${info.color}-500)`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
              <span>Power</span>
              <span className="font-bold text-amber-400">
                {nodeStats.damage.toFixed(1)}
              </span>
            </div>
            <Progress
              value={calculateStatPercentage(nodeStats.damage)}
              className={`h-2 bg-slate-700/50`}
              indicatorClassName={`bg-gradient-to-r from-amber-400 to-amber-800 rounded border-r border-slate-950`}
            />
          </div>
        </div>

        {/* Staked tokens display */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/30 p-2 rounded-md border border-slate-700/30">
          <div>
            <div className="text-slate-400 mb-1 flex justify-between">
              <span>Staked $GODS:</span>
              <span className={`text-${info.color}-400 font-semibold`}>
                {formatNumber(nodeStakedTokens.gods)}
              </span>
            </div>
            {pendingRewards.gods > 0 && (
              <div className="text-slate-400 flex justify-between items-center">
                <span className="flex items-center">
                  <Coins className="w-3 h-3 mr-1 text-amber-400" /> Rewards:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 py-0 px-2 text-xs text-amber-400 border-amber-800/50 hover:bg-amber-900/30"
                  onClick={() => handleClaimRewards("gods")}
                >
                  Claim {formatNumber(pendingRewards.gods)}
                </Button>
              </div>
            )}
          </div>
          <div>
            <div className="text-slate-400 mb-1 flex justify-between">
              <span>Staked $SOUL:</span>
              <span className={`text-${info.color}-400 font-semibold`}>
                {formatNumber(nodeStakedTokens.soul)}
              </span>
            </div>
            {pendingRewards.soul > 0 && (
              <div className="text-slate-400 flex justify-between items-center">
                <span className="flex items-center">
                  <Coins className="w-3 h-3 mr-1 text-purple-400" /> Rewards:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 py-0 px-2 text-xs text-purple-400 border-purple-800/50 hover:bg-purple-900/30"
                  onClick={() => handleClaimRewards("soul")}
                >
                  Claim {formatNumber(pendingRewards.soul)}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Node stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-slate-800/30 p-2 border border-slate-700/30">
            <div className="text-slate-400 text-xs mb-1 flex justify-between">
              <span>Damage</span>
              <span className={`text-${info.color}-400`}>
                {nodeStats.damage.toFixed(1)}
              </span>
            </div>
            <Progress
              value={calculateStatPercentage(nodeStats.damage)}
              className="h-1.5 bg-slate-700/30"
              indicatorClassName={`bg-gradient-to-r from-rose-400 to-rose-700 rounded border-r border-slate-950`}
            />
          </div>

          <div className="rounded-md bg-slate-800/30 p-2 border border-slate-700/30">
            <div className="text-slate-400 text-xs mb-1 flex justify-between">
              <span>Range</span>
              <span className={`text-${info.color}-400`}>
                {nodeStats.range.toFixed(1)}
              </span>
            </div>
            <Progress
              value={calculateStatPercentage(nodeStats.range)}
              className="h-1.5 bg-slate-700/30"
              indicatorClassName={`bg-gradient-to-r from-violet-400 to-violet-700 rounded border-r border-slate-950`}
            />
          </div>

          <div className="rounded-md bg-slate-800/30 p-2 border border-slate-700/30">
            <div className="text-slate-400 text-xs mb-1 flex justify-between">
              <span>Speed</span>
              <span className={`text-${info.color}-400`}>
                {nodeStats.speed.toFixed(1)}
              </span>
            </div>
            <Progress
              value={calculateStatPercentage(nodeStats.speed)}
              className="h-1.5 bg-slate-700/30"
              indicatorClassName={`bg-gradient-to-r from-blue-400 to-blue-700 rounded border-r border-slate-950`}
            />
          </div>

          <div className="rounded-md bg-slate-800/30 p-2 border border-slate-700/30">
            <div className="text-slate-400 text-xs mb-1 flex justify-between">
              <span>Efficiency</span>
              <span className={`text-${info.color}-400`}>
                {nodeStats.efficiency.toFixed(1)}
              </span>
            </div>
            <Progress
              value={calculateStatPercentage(nodeStats.efficiency)}
              className="h-1.5 bg-slate-700/30"
              indicatorClassName={`bg-gradient-to-r from-lime-400 to-lime-700 rounded border-r border-slate-950`}
            />
          </div>
        </div>

        <Tabs defaultValue="stake" className="w-full pt-2">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/30">
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="unstake">Unstake</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-3">
            <div className="flex justify-between text-xs text-slate-400 pb-2">
              <div>Available:</div>
              <div className="space-x-2">
                <span
                  className={
                    selectedToken === "gods" ? `text-${info.color}-400` : ""
                  }
                >
                  $GODS:{" "}
                  {isConnected ? formatNumber(formattedGodsBalance) : "0"}
                </span>
                <span
                  className={
                    selectedToken === "soul" ? `text-${info.color}-400` : ""
                  }
                >
                  $SOUL:{" "}
                  {isConnected ? formatNumber(formattedSoulBalance) : "0"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-slate-700 hover:bg-blue-950",
                  selectedToken === "gods" &&
                    `border-transparent bg-gradient-to-tr from-blue-700 to-blue-950`
                )}
                onClick={() => setSelectedToken("gods")}
              >
                $GODS
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-slate-700 hover:bg-blue-950",
                  selectedToken === "soul" &&
                    `border-transparent bg-gradient-to-tr from-blue-700 to-blue-950`
                )}
                onClick={() => setSelectedToken("soul")}
              >
                $SOUL
              </Button>
            </div>

            <div className="">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Amount: {stakeAmount}</span>
                <span>
                  {selectedToken === "gods" ? "+DAMAGE" : "+RANGE"}:
                  <span className={`text-${info.color}-400 ml-1 font-bold`}>
                    +{(stakeAmount * 0.1).toFixed(1)}
                  </span>
                </span>
              </div>

              <Slider
                value={[stakeAmount]}
                min={1}
                max={Math.max(
                  1,
                  Math.min(50, getAvailableBalance(selectedToken))
                )}
                step={1}
                onValueChange={(value) => setStakeAmount(value[0])}
                className="my-3"
                disabled={
                  !isConnected || getAvailableBalance(selectedToken) === 0
                }
              />

              {!hasAllowance() ? (
                <CyberpunkNeonButton
                  className="w-full"
                  onClick={handleApprove}
                  disabled={
                    !isConnected ||
                    getAvailableBalance(selectedToken) < stakeAmount ||
                    isApproving
                  }
                >
                  {isApproving ? (
                    "Approving..."
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" /> Approve $
                      {selectedToken.toUpperCase()}
                    </>
                  )}
                </CyberpunkNeonButton>
              ) : (
                <CyberpunkNeonButton
                  className="w-full"
                  onClick={handleStake}
                  disabled={
                    !isConnected ||
                    getAvailableBalance(selectedToken) < stakeAmount ||
                    isStaking
                  }
                >
                  {isStaking ? (
                    "Staking..."
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" /> Stake {stakeAmount} $
                      {selectedToken.toUpperCase()}
                    </>
                  )}
                </CyberpunkNeonButton>
              )}

              {!isConnected && (
                <p className="text-xs text-center text-slate-400 mt-2">
                  Connect wallet to stake tokens
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unstake" className="space-y-3">
            <div className="flex justify-between text-xs text-slate-400 pb-2">
              <div>Staked:</div>
              <div className="space-x-2">
                <span
                  className={
                    selectedToken === "gods" ? `text-${info.color}-400` : ""
                  }
                >
                  $GODS: {formatNumber(nodeStakedTokens.gods)}
                </span>
                <span
                  className={
                    selectedToken === "soul" ? `text-${info.color}-400` : ""
                  }
                >
                  $SOUL: {formatNumber(nodeStakedTokens.soul)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-slate-700 hover:bg-blue-950",
                  selectedToken === "gods" &&
                    `border-transparent bg-gradient-to-tr from-blue-700 to-blue-950`
                )}
                onClick={() => setSelectedToken("gods")}
              >
                $GODS
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-slate-700 hover:bg-blue-950",
                  selectedToken === "soul" &&
                    `border-transparent bg-gradient-to-tr from-blue-700 to-blue-950`
                )}
                onClick={() => setSelectedToken("soul")}
              >
                $SOUL
              </Button>
            </div>

            <div className="">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Amount: {stakeAmount}</span>
                <span>
                  {selectedToken === "gods" ? "-DAMAGE" : "-RANGE"}:
                  <span className="text-red-400 ml-1 font-bold">
                    -{(stakeAmount * 0.1).toFixed(1)}
                  </span>
                </span>
              </div>

              <Slider
                value={[stakeAmount]}
                min={1}
                max={Math.max(1, Math.min(50, nodeStakedTokens[selectedToken]))}
                step={1}
                onValueChange={(value) => setStakeAmount(value[0])}
                className="my-3"
                disabled={!isConnected || nodeStakedTokens[selectedToken] < 1}
              />

              <CyberpunkNeonButton
                className="w-full"
                variant="magenta"
                onClick={handleUnstake}
                disabled={
                  !isConnected ||
                  nodeStakedTokens[selectedToken] < stakeAmount ||
                  isUnstaking
                }
              >
                {isUnstaking ? (
                  "Unstaking..."
                ) : (
                  <>
                    <Minus className="mr-1 h-4 w-4" />
                    Unstake {stakeAmount} ${selectedToken.toUpperCase()}
                  </>
                )}
              </CyberpunkNeonButton>

              {!isConnected && (
                <p className="text-xs text-center text-slate-400 mt-2">
                  Connect wallet to unstake tokens
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <style jsx>{`
          @keyframes orbit {
            from {
              transform: rotate(0deg) translateX(25px) rotate(0deg);
            }
            to {
              transform: rotate(360deg) translateX(25px) rotate(-360deg);
            }
          }

          @keyframes pulse-glow {
            0%,
            100% {
              filter: blur(1px);
              opacity: 0.8;
            }
            50% {
              filter: blur(3px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default NodePool;
