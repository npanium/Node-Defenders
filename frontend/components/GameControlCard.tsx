"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Shield,
  Swords,
  Flame,
  Crown,
  Zap,
  Skull,
  ShipWheel,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { CyberPanel } from "./cyberpunk/CyberPanel";
import HolographicDisplay from "./cyberpunk/HolographicDisplay";
import { chakra } from "@/lib/fonts";
import FancyCyberpunkCard from "./cyberpunk/FancyCyberpunkCard";

interface NodeType {
  count: number;
  power: number;
  tier: number;
  tokenType: "GODS" | "SOUL";
}

interface LiquidityPool {
  totalNodesPlaced: number;
  lastUpdated: string;
  mainNodeHealth: number;
  currentWave: number;
  nextWaveCountdown: number;
  nodeTypes: Record<string, NodeType>;
  totalValue: number;
  aprEstimate: number;
}

export function GameControlCard() {
  const [pool, setPool] = useState<LiquidityPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>("");
  const [nextWaveTimer, setNextWaveTimer] = useState<string>("");
  const [isYieldFrenzy, setIsYieldFrenzy] = useState(false);

  // Function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  // Calculate time elapsed
  useEffect(() => {
    if (!pool?.lastUpdated) return;

    const updateTimeElapsed = () => {
      const lastUpdated = new Date(pool.lastUpdated);
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffHours > 0) {
        setTimeElapsed(`${diffHours}h ${diffMins % 60}m ago`);
      } else if (diffMins > 0) {
        setTimeElapsed(`${diffMins}m ${diffSecs % 60}s ago`);
      } else {
        setTimeElapsed(`${diffSecs}s ago`);
      }
    };

    updateTimeElapsed();
    const interval = setInterval(updateTimeElapsed, 1000);

    return () => clearInterval(interval);
  }, [pool?.lastUpdated]);

  // Calculate next wave countdown
  useEffect(() => {
    if (pool?.nextWaveCountdown === undefined) return;

    const updateWaveCountdown = () => {
      let countdown = Math.max(0, pool.nextWaveCountdown - 1);

      // Check for Yield Frenzy (every 5 waves)
      if (pool.currentWave > 0 && pool.currentWave % 5 === 0) {
        setIsYieldFrenzy(true);
      } else {
        setIsYieldFrenzy(false);
      }

      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      setNextWaveTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      setPool((prev) =>
        prev ? { ...prev, nextWaveCountdown: countdown } : null
      );
    };

    const interval = setInterval(updateWaveCountdown, 1000);
    return () => clearInterval(interval);
  }, [pool?.nextWaveCountdown, pool?.currentWave]);

  // Function to fetch data
  const fetchPoolData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/api/game-state");
      const result = await response.json();

      if (result.success && result.data) {
        // Simulate game data
        const mockGameData = {
          ...result.data,
          mainNodeHealth: 85,
          currentWave: 8,
          nextWaveCountdown: 45,
          totalValue: 124500,
          aprEstimate: isYieldFrenzy ? 32.4 : 10.8,
          nodeTypes: {
            "Elite Blaster": {
              count: 12,
              power: 75,
              tier: 3,
              tokenType: "GODS",
            },
            "Divine Cannon": {
              count: 5,
              power: 120,
              tier: 4,
              tokenType: "GODS",
            },
            "Soul Guardian": {
              count: 28,
              power: 45,
              tier: 2,
              tokenType: "SOUL",
            },
            "Anchor Defender": {
              count: 18,
              power: 30,
              tier: 1,
              tokenType: "SOUL",
            },
          },
        };
        setPool(mockGameData as LiquidityPool);
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup WebSocket connection
  useEffect(() => {
    setPool({
      totalNodesPlaced: 4,
      lastUpdated: "10mins",
      mainNodeHealth: 90,
      currentWave: 2,
      nextWaveCountdown: 40,
      nodeTypes: {},
      totalValue: 100,
      aprEstimate: 4,
    });

    const setupWebSocket = () => {
      const ws = new WebSocket("ws://localhost:4000");

      ws.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "state_update" && message.data) {
            // Simulate game data for demonstration
            const gameData = {
              ...message.data,
              mainNodeHealth: 85,
              currentWave: Math.floor(Math.random() * 20) + 1,
              nextWaveCountdown: Math.floor(Math.random() * 60) + 30,
              totalValue: 124500 + Math.floor(Math.random() * 1000),
              aprEstimate: isYieldFrenzy ? 32.4 : 10.8,
              nodeTypes: {
                "Elite Blaster": {
                  count: 12,
                  power: 75,
                  tier: 3,
                  tokenType: "GODS",
                },
                "Divine Cannon": {
                  count: 5,
                  power: 120,
                  tier: 4,
                  tokenType: "GODS",
                },
                "Soul Guardian": {
                  count: 28,
                  power: 45,
                  tier: 2,
                  tokenType: "SOUL",
                },
                "Anchor Defender": {
                  count: 18,
                  power: 30,
                  tier: 1,
                  tokenType: "SOUL",
                },
              },
            };
            setPool(gameData as LiquidityPool);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnected(false);

        // Try to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

      setSocket(ws);
    };

    setupWebSocket();

    // Initial data fetch as fallback
    fetchPoolData();

    // Cleanup function
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Calculate total nodes across all types
  const totalNodes = pool?.nodeTypes
    ? Object.values(pool.nodeTypes).reduce((sum, node) => sum + node.count, 0)
    : 0;

  // Calculate GODS vs SOUL node distribution
  const nodesByToken = pool?.nodeTypes
    ? Object.values(pool.nodeTypes).reduce((acc, node) => {
        acc[node.tokenType] = (acc[node.tokenType] || 0) + node.count;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const godsPercentage = nodesByToken["GODS"]
    ? (nodesByToken["GODS"] / totalNodes) * 100
    : 0;
  const soulPercentage = nodesByToken["SOUL"]
    ? (nodesByToken["SOUL"] / totalNodes) * 100
    : 0;

  return (
    <>
      <CyberPanel title="Node Commander" variant="yellow">
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-foreground/60">
              Main Node Health
            </p>
            <span
              className={`text-sm font-bold ${
                pool?.mainNodeHealth && pool.mainNodeHealth < 30
                  ? "text-red-400 "
                  : pool?.mainNodeHealth && pool.mainNodeHealth < 60
                  ? "text-amber-400 "
                  : "text-emerald-400"
              }`}
            >
              {pool?.mainNodeHealth || 10}%
            </span>
          </div>
          <Progress
            value={pool?.mainNodeHealth || 10}
            className={`h-3 border ${
              pool?.mainNodeHealth && pool.mainNodeHealth < 30
                ? "border-red-400 shadow-[0px_0px_10px_0px_#ffa2a260]"
                : pool?.mainNodeHealth && pool.mainNodeHealth < 60
                ? "border-amber-400 shadow-[0px_0px_10px_0px_#ffdf2060]"
                : "border-emerald-400 shadow-[0px_0px_10px_0px_#7bf1a860]"
            }`}
            indicatorClassName={`${
              pool?.mainNodeHealth && pool.mainNodeHealth < 30
                ? "bg-red-600 rounded"
                : pool?.mainNodeHealth && pool.mainNodeHealth < 60
                ? "bg-amber-500 rounded"
                : "bg-emerald-500 rounded"
            }`}
          />
        </div>
        <FancyCyberpunkCard
          className={`rounded-lg my-6 p-3 flex items-center justify-between border border-rose-500 ${
            isYieldFrenzy ? "bg-amber-100 dark:bg-amber-950/20" : "bg-primary/5"
          }`}
          style={{
            boxShadow: "inset 0px 0px 20px 0px #b71e53",
            background: "#b71e5334",
          }}
        >
          <div className="flex gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              <Skull
                className={`h-7 w-7 text-rose-600 fill-rose-600/30 animate-pulse duration-1000`}
              />
              <div>
                <p className="text-sm font-medium">Next Wave</p>
                <p className="text-xs text-muted-foreground">
                  Prepare your defenses
                </p>
              </div>
            </div>
            <div
              className={`${chakra.className} text-2xl font-bold tabular-nums ${
                isYieldFrenzy ? "text-amber-700 dark:text-amber-400" : ""
              }`}
            >
              {nextWaveTimer}
            </div>
          </div>
        </FancyCyberpunkCard>
      </CyberPanel>
    </>
  );
}
