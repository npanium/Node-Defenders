import { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GameData } from "@/lib/types/core";
// Helper function to safely format betting amounts
const parseBettingAmount = (amountStr: string): string => {
  try {
    // Clean the string to ensure it's a valid numeric value
    const numStr = amountStr.replace(/[^\d.]/g, "");
    if (!numStr || isNaN(Number(numStr))) return "0.00";

    // If the number is very large (like wei values), scale it down
    if (numStr.length > 10) {
      return (Number(numStr) / 1e18).toFixed(2);
    }

    return Number(numStr).toFixed(2);
  } catch (e) {
    console.error("Error parsing betting amount:", e);
    return "0.00";
  }
};

interface GameLeaderboardProps {
  gameData: GameData[];
  selectedAddresses: string[];
  bets: Record<string, "top" | "bottom">;
  isLoading?: boolean;
  onPlaceBet: (
    address: string,
    position: boolean,
    amount: string
  ) => Promise<boolean>;
  // Add additional props to show betting amounts
  bettingAmounts?: Record<string, { up: string; down: string }>;
}

export function GameLeaderboard({
  gameData,
  selectedAddresses,
  bets,
  isLoading = false,
  onPlaceBet,
  bettingAmounts = {},
}: GameLeaderboardProps) {
  const [betAmount, setBetAmount] = useState<string>("1");
  const [placingBet, setPlacingBet] = useState<string | null>(null);

  const handlePlaceBet = async (address: string, position: boolean) => {
    setPlacingBet(address);
    try {
      // Convert betAmount to wei (assuming input is in ETH)
      const amountInWei = (parseFloat(betAmount) * 1e18).toString();
      await onPlaceBet(address, position, amountInWei);
    } catch (error) {
      console.error("Error placing bet:", error);
    } finally {
      setPlacingBet(null);
    }
  };

  // Filter data to show only the selected addresses
  const displayData = gameData.filter((item) =>
    selectedAddresses.includes(item.address)
  );

  // If there are no selected addresses or we're still loading,
  // display placeholders
  const showPlaceholders = isLoading || displayData.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="Bet amount in $GODS"
          className="w-40"
          min="0"
          step="0.1"
        />
        <span className="text-sm text-muted-foreground">$GODS</span>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-1/6">Top Pool</TableHead>
              <TableHead className="w-1/6">Bottom Pool</TableHead>
              <TableHead className="w-1/4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showPlaceholders
              ? // Display skeletons when loading or no data
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-20" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              : // Display actual data
                displayData.map((item) => (
                  <TableRow key={item.address}>
                    <TableCell className="font-mono">
                      {item.address.slice(0, 6)}...{item.address.slice(-4)}
                    </TableCell>
                    <TableCell>
                      {bets[item.address] ? (
                        <Badge
                          variant={
                            bets[item.address] === "top"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {bets[item.address] === "top"
                            ? "Top 50%"
                            : "Bottom 50%"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No bet placed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {bettingAmounts[item.address]?.up
                        ? `${parseBettingAmount(
                            bettingAmounts[item.address].up
                          )} $GODS`
                        : "0.00 $GODS"}
                    </TableCell>
                    <TableCell>
                      {bettingAmounts[item.address]?.down
                        ? `${parseBettingAmount(
                            bettingAmounts[item.address].down
                          )} $GODS`
                        : "0.00 $GODS"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            bets[item.address] === "top" ? "default" : "outline"
                          }
                          onClick={() => handlePlaceBet(item.address, true)}
                          disabled={!!placingBet || !!bets[item.address]}
                        >
                          {placingBet === item.address
                            ? "Placing..."
                            : "Top 50%"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            bets[item.address] === "bottom"
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() => handlePlaceBet(item.address, false)}
                          disabled={!!placingBet || !!bets[item.address]}
                        >
                          {placingBet === item.address
                            ? "Placing..."
                            : "Bottom 50%"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
