import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Zap, Target, Swords, Plus, Minus } from "lucide-react";
import { CyberPoolPanel } from "./cyberpunk/CyberPoolPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnimatedNeonButtonGroup from "./cyberpunk/AnimatedNeonButtonGroup";
import CyberpunkNeonButton from "./cyberpunk/CyberpunkNeonButton";

// Node types
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
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [selectedToken, setSelectedToken] = useState<"gods" | "soul">("gods");
  const [isHovering, setIsHovering] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  const info = nodeTypeInfo[nodeType];

  // Pulse effect when stats change
  useEffect(() => {
    setPulseEffect(true);
    const timer = setTimeout(() => setPulseEffect(false), 2000);
    return () => clearTimeout(timer);
  }, [nodeStats]);

  // Calculate stat percentage for display
  const calculateStatPercentage = (value: number) => {
    return Math.min(Math.max(value * 10, 0), 100);
  };

  // Format numbers to look cleaner
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Node Icon Component
  const NodeIcon = info.icon;

  return (
    // <CyberPoolPanel
    //   title={`${info.title} #${nodeId.slice(0, 4)}`}
    //   variant={info.color as any}
    //   className={cn("w-full max-w-md", className)}
    //   headerContent={
    //     <div className="flex items-center gap-2">
    //       <span className="bg-slate-800/50 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700/50">
    //         Pool: {formatNumber(poolSize)}
    //       </span>
    //     </div>
    //   }
    // >
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
        {/* <div className="w-full border-t border-cyan-500/40" /> */}
        <Tabs defaultValue="stake" className="w-full pt-2 ">
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
                  $GODS: {formatNumber(100 - stakedTokens.gods)}
                </span>
                <span
                  className={
                    selectedToken === "soul" ? `text-${info.color}-400` : ""
                  }
                >
                  $SOUL: {formatNumber(100 - stakedTokens.soul)}
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
                {/* <span className="ml-1 text-xs text-slate-400">(+DAMAGE)</span> */}
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
                {/* <span className="ml-1 text-xs text-slate-400">(+RANGE)</span> */}
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
                max={Math.min(
                  50,
                  selectedToken === "gods"
                    ? 100 - stakedTokens.gods
                    : 100 - stakedTokens.soul
                )}
                step={1}
                onValueChange={(value) => setStakeAmount(value[0])}
                className="my-3"
              />

              <CyberpunkNeonButton
                className="w-full"
                onClick={() => onStake(selectedToken, stakeAmount)}
              >
                <Plus className="mr-1 h-4 w-4" /> Stake {stakeAmount} $
                {selectedToken.toUpperCase()}
              </CyberpunkNeonButton>
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
              />

              <CyberpunkNeonButton
                className="w-full"
                variant="magenta"
                onClick={() => onUnstake(selectedToken, stakeAmount)}
              >
                <Minus className="mr-1 h-4 w-4" />
                Unstake {stakeAmount} ${selectedToken.toUpperCase()}
              </CyberpunkNeonButton>
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
