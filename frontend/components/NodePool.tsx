import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Zap, Target, Swords, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CyberpunkNeonButton from "./cyberpunk/CyberpunkNeonButton";
import useSocket from "@/lib/hooks/useSocket";
import {
  useAccount,
  useContractRead,
  useReadContract,
  useWatchContractEvent,
} from "wagmi";

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

// Minimal ERC20 ABI for balanceOf and Transfer event
const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

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
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [selectedToken, setSelectedToken] = useState<"gods" | "soul">("gods");
  const [isHovering, setIsHovering] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const { sendUIAction } = useSocket();

  const info = nodeTypeInfo[nodeType];

  // Use wagmi hooks for wallet connection and balances
  const { address, isConnected } = useAccount();

  // Get GODS token balance
  const { data: godsBalance, refetch: refetchGodsBalance } = useReadContract({
    address: godsTokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Get SOUL token balance
  const { data: soulBalance, refetch: refetchSoulBalance } = useReadContract({
    address: soulTokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

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

  // Convert token balances from wei to ether (formatted values)
  const formattedGodsBalance = godsBalance
    ? parseFloat(Number(godsBalance) / 10 ** 18 + "")
    : 0;

  const formattedSoulBalance = soulBalance
    ? parseFloat(Number(soulBalance) / 10 ** 18 + "")
    : 0;

  // Manually refresh balances (can be used after transactions)
  const refreshBalances = () => {
    if (isConnected) {
      refetchGodsBalance();
      refetchSoulBalance();
    }
  };

  // Effect to trigger pulse when stats change
  useEffect(() => {
    setPulseEffect(true);
    const timer = setTimeout(() => setPulseEffect(false), 2000);
    return () => clearTimeout(timer);
  }, [nodeStats]);

  // Effect to refresh balances when component mounts or address changes
  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
    }
  }, [isConnected, address]);

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

  // Handle staking with WebSocket integration
  const handleStake = () => {
    if (!isConnected) return;

    // Check if user has enough balance
    const availableBalance = getAvailableBalance(selectedToken);
    if (availableBalance < stakeAmount) {
      alert(`Insufficient ${selectedToken.toUpperCase()} balance`);
      return;
    }

    // Local state update
    onStake(selectedToken, stakeAmount);

    // Send to backend for synchronization with the game
    sendUIAction("stake_tokens", {
      nodeId,
      tokenType: selectedToken,
      amount: stakeAmount,
    });

    // Refresh balances after staking action
    setTimeout(refreshBalances, 2000); // Short delay to allow transaction to complete
  };

  // Handle unstaking with WebSocket integration
  const handleUnstake = () => {
    if (!isConnected) return;

    // Only unstake if we have tokens staked
    if (stakedTokens[selectedToken] >= stakeAmount) {
      // Local state update
      onUnstake(selectedToken, stakeAmount);

      // Send to backend for synchronization with the game
      sendUIAction("unstake_tokens", {
        nodeId,
        tokenType: selectedToken,
        amount: stakeAmount,
      });

      // Refresh balances after unstaking action
      setTimeout(refreshBalances, 2000); // Short delay to allow transaction to complete
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

              <CyberpunkNeonButton
                className="w-full"
                onClick={handleStake}
                disabled={
                  !isConnected ||
                  getAvailableBalance(selectedToken) < stakeAmount
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Stake {stakeAmount} $
                {selectedToken.toUpperCase()}
              </CyberpunkNeonButton>

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
                  $GODS: {formatNumber(stakedTokens.gods)}
                </span>
                <span
                  className={
                    selectedToken === "soul" ? `text-${info.color}-400` : ""
                  }
                >
                  $SOUL: {formatNumber(stakedTokens.soul)}
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
                max={
                  selectedToken === "gods"
                    ? Math.max(stakedTokens.gods, 1)
                    : Math.max(stakedTokens.soul, 1)
                }
                step={1}
                onValueChange={(value) => setStakeAmount(value[0])}
                className="my-3"
                disabled={!isConnected || stakedTokens[selectedToken] < 1}
              />

              <CyberpunkNeonButton
                className="w-full"
                variant="magenta"
                onClick={handleUnstake}
                disabled={
                  !isConnected || stakedTokens[selectedToken] < stakeAmount
                }
              >
                <Minus className="mr-1 h-4 w-4" />
                Unstake {stakeAmount} ${selectedToken.toUpperCase()}
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
