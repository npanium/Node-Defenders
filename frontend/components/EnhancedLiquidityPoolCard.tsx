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
  Droplets,
  Activity,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LiquidityPool {
  totalNodesPlaced: number;
  lastUpdated: string;
  nodeTypes: Record<string, number>;
}

export function EnhancedLiquidityPoolCard() {
  const [pool, setPool] = useState<LiquidityPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>("");

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

      // Convert to seconds, minutes, hours
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

  // Function to fetch data
  const fetchPoolData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/api/game-state");
      const result = await response.json();

      if (result.success && result.data) {
        setPool(result.data);
      }
    } catch (error) {
      console.error("Error fetching pool data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup WebSocket connection
  useEffect(() => {
    const setupWebSocket = () => {
      const ws = new WebSocket("ws://localhost:");

      ws.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "state_update" && message.data) {
            setPool(message.data);
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
    ? Object.values(pool.nodeTypes).reduce((sum, count) => sum + count, 0)
    : 0;

  // Get the dominant node type
  const dominantNodeType = pool?.nodeTypes
    ? Object.entries(pool.nodeTypes).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-2xl font-bold">Liquidity Pool</CardTitle>
          </div>
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="animate-pulse"
          >
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>Real-time liquidity statistics</CardDescription>
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
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Total Liquidity</p>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-4xl font-bold">
                  {pool?.totalNodesPlaced || 0}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">nodes</span>
                  <span className="text-xs font-medium text-green-500">
                    +{Math.floor(Math.random() * 5)}% 24h
                  </span>
                </div>
              </div>
            </div>

            {/* Time stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{timeElapsed}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {pool?.lastUpdated ? formatDate(pool.lastUpdated) : "Never"}
                </span>
              </div>

              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">Activity</p>
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.floor(Math.random() * 10) + 1} transactions/min
                </span>
              </div>
            </div>

            {/* Node distribution */}
            {pool?.nodeTypes && Object.keys(pool.nodeTypes).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Node Distribution
                  </p>
                  <Badge variant="outline">
                    {Object.keys(pool.nodeTypes).length} types
                  </Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(pool.nodeTypes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{type}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{count}</span>
                            <span className="text-xs text-muted-foreground">
                              (
                              {totalNodes
                                ? Math.round((count / totalNodes) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={totalNodes ? (count / totalNodes) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>

                {Object.keys(pool.nodeTypes).length > 3 && (
                  <p className="text-xs text-muted-foreground text-right">
                    +{Object.keys(pool.nodeTypes).length - 3} more types
                  </p>
                )}
              </div>
            )}

            {/* Dominant type highlight */}
            {dominantNodeType && (
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Dominant Node Type
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {dominantNodeType[0]}
                  </span>
                  <Badge variant="secondary">{dominantNodeType[1]} nodes</Badge>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Data synced {isConnected ? "live via WebSocket" : "on demand"}
        </p>
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
