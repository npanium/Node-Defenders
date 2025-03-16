"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Heart, HeartCrack, Skull, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CyberPanel } from "./cyberpunk/CyberPanel";
import { chakra } from "@/lib/fonts";
import FancyCyberpunkCard from "./cyberpunk/FancyCyberpunkCard";
import useSocket from "@/lib/hooks/useSocket";

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

  const {
    isConnected,
    gameState,
    gameOver,
    gameWon,
    waveInfo,
    gameStats,
    healNode,
    getMainNodeHealth,
    resetGameWon,
  } = useSocket();

  const mainNodeHealth = getMainNodeHealth();
  const healthPercentage = Math.round(mainNodeHealth.healthPercentage * 100);

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

  useEffect(() => {
    if (waveInfo.isCountingDown) {
      // Update countdown display from socket data
      const minutes = Math.floor(waveInfo.countdown / 60);
      const seconds = Math.floor(waveInfo.countdown % 60);
      setNextWaveTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      // Check for Yield Frenzy (every 5 waves)
      if (waveInfo.currentWave > 0 && waveInfo.currentWave % 5 === 0) {
        setIsYieldFrenzy(true);
      } else {
        setIsYieldFrenzy(false);
      }
    } else if (waveInfo.isWaveInProgress) {
      setNextWaveTimer("In Progress");
    }
  }, [waveInfo]);

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
        <div className="mt-2 text-xs flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-emerald-500" : "bg-red-500"
            }`}
          ></div>
          <span>{isConnected ? "Connected to game" : "Disconnected"}</span>
        </div>
        <span className="text-muted-foreground">Wave:</span>{" "}
        <span className="font-bold">{waveInfo.currentWave}</span>
        {/* Stats section */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center p-2 bg-primary/5 rounded-lg border border-primary/20">
            <Coins className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="text-sm font-bold">{gameStats.currency}</p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-primary/5 rounded-lg border border-primary/20">
            <Skull className="h-5 w-5 text-rose-500 mr-2" />
            <div>
              <p className="text-xs text-muted-foreground">Enemies Killed</p>
              <p className="text-sm font-bold">{gameStats.enemiesKilled}</p>
            </div>
          </div>
        </div>
        {/* Stats end */}
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
                  {waveInfo.isCountingDown
                    ? "Prepare your defenses"
                    : waveInfo.isWaveInProgress
                    ? `Fighting ${waveInfo.enemiesInWave} enemies`
                    : "Wave completed"}
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
        {/* Game won display */}
        {gameWon.isWon && (
          <div className="mt-4 p-4 border border-green-500 bg-green-500/10 rounded-lg">
            <div className="flex items-center mb-2">
              <Trophy className="text-green-500 mr-2 h-6 w-6" />
              <h3 className="text-lg font-bold text-green-500">Victory!</h3>
            </div>
            <p className="text-sm">All {waveInfo.maxWaves} waves completed!</p>
            <Button
              className="mt-2 w-full"
              variant="outline"
              onClick={resetGameWon}
            >
              Play Again
            </Button>
          </div>
        )}
      </CyberPanel>
    </>
  );
}
