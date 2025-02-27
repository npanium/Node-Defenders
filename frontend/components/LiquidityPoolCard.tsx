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
import { ArrowUpCircle, Clock, TrendingUp } from "lucide-react";

interface LiquidityPool {
  totalNodesPlaced: number;
  lastUpdated: string;
  nodeTypes: Record<string, number>;
}

export function LiquidityPoolCard() {
  const [pool, setPool] = useState<LiquidityPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

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

  // Function to fetch data
  const fetchPoolData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/game-state");
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
      const ws = new WebSocket("ws://localhost:8080");

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

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Liquidity Pool</CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>Real-time pool statistics</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Total Liquidity</p>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">
                  {pool?.totalNodesPlaced || 0}
                </span>
                <span className="text-muted-foreground">nodes</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {pool?.lastUpdated ? formatDate(pool.lastUpdated) : "Never"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">Node Types</p>
                <div className="text-sm">
                  {pool?.nodeTypes && Object.keys(pool.nodeTypes).length > 0 ? (
                    <span className="font-medium">
                      {Object.keys(pool.nodeTypes).length} types
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No types</span>
                  )}
                </div>
              </div>
            </div>

            {pool?.nodeTypes && Object.keys(pool.nodeTypes).length > 0 && (
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">Distribution</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(pool.nodeTypes).map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <span>{type}</span>
                      <span className="bg-primary/10 px-1 rounded text-xs">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Data synced via WebSocket
        </p>
        <Button size="sm" variant="outline" onClick={fetchPoolData}>
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
