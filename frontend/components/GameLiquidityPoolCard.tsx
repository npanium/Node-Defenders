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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";

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

export function GameLiquidityPoolCard() {
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
      const response = await fetch("http://localhost:8080/api/game-state");
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
    const setupWebSocket = () => {
      const ws = new WebSocket("ws://localhost:8080");

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
    <Card
      className={`w-full shadow-lg transition-shadow duration-300 border-2 ${
        isYieldFrenzy
          ? "border-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-background"
          : "hover:shadow-xl"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isYieldFrenzy ? (
              <Flame className="h-6 w-6 text-amber-500 animate-pulse" />
            ) : (
              <Shield className="h-6 w-6 text-blue-500" />
            )}
            <CardTitle className="text-2xl font-bold">
              {isYieldFrenzy ? "YIELD FRENZY" : "Node Commander"}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Wave {pool?.currentWave || "?"}
            </Badge>
            <Badge
              variant={
                isConnected
                  ? isYieldFrenzy
                    ? "destructive"
                    : "default"
                  : "destructive"
              }
              className={
                isYieldFrenzy ? "animate-pulse bg-amber-500" : "animate-pulse"
              }
            >
              {isConnected
                ? isYieldFrenzy
                  ? "3x REWARDS"
                  : "Live"
                : "Disconnected"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {isYieldFrenzy
            ? "Triple rewards active! Enemies spawn 3x faster"
            : "Command your nodes, earn rewards"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {/* Main Node Health */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Main Node Health
                </p>
                <span className="text-sm font-bold">
                  {pool?.mainNodeHealth || 0}%
                </span>
              </div>
              <Progress
                value={pool?.mainNodeHealth || 0}
                className="h-3"
                indicatorClassName={`${
                  pool?.mainNodeHealth && pool.mainNodeHealth < 30
                    ? "bg-red-500"
                    : pool?.mainNodeHealth && pool.mainNodeHealth < 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
            </div>

            {/* Next Wave Timer */}
            <div
              className={`rounded-lg p-3 flex items-center justify-between ${
                isYieldFrenzy
                  ? "bg-amber-100 dark:bg-amber-950/20"
                  : "bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Skull
                  className={`h-5 w-5 ${
                    isYieldFrenzy ? "text-amber-600" : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">Next Wave</p>
                  <p className="text-xs text-muted-foreground">
                    Prepare your defenses
                  </p>
                </div>
              </div>
              <div
                className={`text-3xl font-bold tabular-nums ${
                  isYieldFrenzy ? "text-amber-700 dark:text-amber-400" : ""
                }`}
              >
                {nextWaveTimer}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* TVL & APR */}
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">
                  Total Value Locked
                </p>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    {pool?.totalValue?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap
                    className={`h-4 w-4 ${
                      isYieldFrenzy ? "text-amber-500" : "text-blue-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isYieldFrenzy ? "text-amber-600" : ""
                    }`}
                  >
                    APR: {pool?.aprEstimate || 0}%{isYieldFrenzy && " (3x)"}
                  </span>
                </div>
              </div>

              {/* Node Stats */}
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">Node Fleet</p>
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold">{totalNodes}</span>
                  <span className="text-sm text-muted-foreground">
                    active nodes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span className="text-xs ml-1">
                      {Math.round(godsPercentage)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span className="text-xs ml-1">
                      {Math.round(soulPercentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Node distribution */}
            {pool?.nodeTypes && Object.keys(pool.nodeTypes).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Node Arsenal
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(pool.nodeTypes)
                    .sort((a, b) => {
                      // Sort by token type first (GODS first), then by tier
                      if (a[1].tokenType === b[1].tokenType) {
                        return b[1].tier - a[1].tier;
                      }
                      return a[1].tokenType === "GODS" ? -1 : 1;
                    })
                    .map(([type, node]) => (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {node.tokenType === "GODS" ? (
                              <Crown className="h-3 w-3 text-amber-500" />
                            ) : (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                            <span
                              className={`text-sm ${
                                node.tokenType === "GODS"
                                  ? "font-semibold text-amber-700 dark:text-amber-400"
                                  : ""
                              }`}
                            >
                              {type}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Tier {node.tier}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                              {node.count}
                            </span>
                            <Swords className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-semibold">
                              {node.power}
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={
                            totalNodes ? (node.count / totalNodes) * 100 : 0
                          }
                          className="h-2"
                          indicatorClassName={
                            node.tokenType === "GODS" ? "bg-amber-500" : ""
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <Button
          size="sm"
          variant={isYieldFrenzy ? "destructive" : "default"}
          className={isYieldFrenzy ? "bg-amber-500 hover:bg-amber-600" : ""}
          onClick={() => alert("Placing new node...")}
        >
          <Zap className="mr-2 h-4 w-4" />
          {isYieldFrenzy ? "Add Node (3x APR)" : "Place New Node"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchPoolData}
          disabled={isLoading}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
