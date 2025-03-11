"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartCrack, Skull } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CyberPanel } from "./cyberpunk/CyberPanel";
import { chakra } from "@/lib/fonts";
import FancyCyberpunkCard from "./cyberpunk/FancyCyberpunkCard";
import useSocket from "@/lib/hooks/useSocket"; // Import our socket hook

interface NodeType {
  count: number;
  power: number;
  tier: number;
  tokenType: "GODS" | "SOUL";
}

interface LiquidityPool {
  totalNodesPlaced: number;
  lastUpdated: string;
  currentWave: number;
  nextWaveCountdown: number;
  nodeTypes: Record<string, NodeType>;
  totalValue: number;
  aprEstimate: number;
}

export function GameControlCard() {
  const [pool, setPool] = useState<LiquidityPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState<string>("");
  const [nextWaveTimer, setNextWaveTimer] = useState<string>("");
  const [isYieldFrenzy, setIsYieldFrenzy] = useState(false);

  // Use our socket hook to get real-time updates
  const { isConnected, gameState, gameOver, getMainNodeHealth } = useSocket();

  // Get main node health data from the socket
  const mainNodeHealth = getMainNodeHealth();
  const healthPercentage = Math.round(mainNodeHealth.healthPercentage * 100);

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
        // Use real data from server, with some mock data for wave information
        const gameData = {
          ...result.data,
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
        setPool(gameData as LiquidityPool);
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch as fallback in case WebSocket isn't working
  useEffect(() => {
    // Set some initial data
    setPool({
      totalNodesPlaced: 4,
      lastUpdated: new Date().toISOString(),
      currentWave: 2,
      nextWaveCountdown: 40,
      nodeTypes: {},
      totalValue: 100,
      aprEstimate: 4,
    });

    // Initial data fetch as fallback
    fetchPoolData();
  }, []);

  // Update pool data when gameState changes
  useEffect(() => {
    if (gameState && Object.keys(gameState).length > 0) {
      // Merge WebSocket gameState with wave information
      setPool((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          totalNodesPlaced: gameState.totalNodesPlaced || prev.totalNodesPlaced,
          lastUpdated: new Date(gameState.lastUpdated).toISOString(),
        };
      });
    }
  }, [gameState]);

  // Game over effect
  useEffect(() => {
    if (gameOver.isOver) {
      // Handle game over state
      console.log(`Game Over! Cause: ${gameOver.cause}`);
      // Show game over UI or modal
    }
  }, [gameOver]);

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
                healthPercentage < 30
                  ? "text-red-400 "
                  : healthPercentage < 60
                  ? "text-amber-400 "
                  : "text-emerald-400"
              }`}
            >
              {mainNodeHealth.currentHealth}/{mainNodeHealth.maxHealth} (
              {healthPercentage}%)
            </span>
          </div>
          <Progress
            value={healthPercentage}
            className={`h-3 border ${
              healthPercentage < 30
                ? "border-red-400 shadow-[0px_0px_10px_0px_#ffa2a260]"
                : healthPercentage < 60
                ? "border-amber-400 shadow-[0px_0px_10px_0px_#ffdf2060]"
                : "border-emerald-400 shadow-[0px_0px_10px_0px_#7bf1a860]"
            }`}
            indicatorClassName={`${
              healthPercentage < 30
                ? "bg-red-600 rounded"
                : healthPercentage < 60
                ? "bg-amber-500 rounded"
                : "bg-emerald-500 rounded"
            }`}
          />
        </div>

        {/* <Button
          onClick={handleHealMainNode}
          className="mt-2 w-full"
          variant="outline"
          disabled={!isConnected || healthPercentage >= 100}
        >
          <Heart className="mr-2 h-4 w-4" />
          Heal Main Node (+10)
        </Button> */}

        {/* Connection status */}
        <div className="mt-2 text-xs flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-emerald-500" : "bg-red-500"
            }`}
          ></div>
          <span>{isConnected ? "Connected to game" : "Disconnected"}</span>
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

        {/* Game over display */}
        {gameOver.isOver && (
          <div className="mt-4 p-4 border border-red-500 bg-red-500/10 rounded-lg">
            <div className="flex items-center mb-2">
              <HeartCrack className="text-red-500 mr-2 h-6 w-6" />
              <h3 className="text-lg font-bold text-red-500">Game Over</h3>
            </div>
            <p className="text-sm">{gameOver.cause}</p>
          </div>
        )}
      </CyberPanel>
    </>
  );
}
