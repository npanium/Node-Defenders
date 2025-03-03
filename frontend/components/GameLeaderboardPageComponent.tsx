"use client";
import { useState, useEffect } from "react";
import { useGameActions } from "@/lib/hooks/useGameActions";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { GameData } from "@/lib/types/core";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockGameData,
  mockSelectedAddresses,
  mockBets,
  mockGameService,
} from "@/lib/mockGameService";

export default function GameLeaderboardPageComponent() {
  // State for controlling mock vs real data
  const [useMockData, setUseMockData] = useState(true);
  const [isRoundOngoing, setIsRoundOngoing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // State for betting amounts
  const [bettingAmounts, setBettingAmounts] = useState<
    Record<string, { up: string; down: string }>
  >({});

  // Get real data and actions from your hook
  const {
    loading: realLoading,
    gameData: realGameData,
    selectedAddresses: realSelectedAddresses,
    bets: realBets,
    windowActive,
    actions: realActions,
  } = useGameActions();

  // Combine real and mock data based on the useMockData flag
  const gameData = useMockData ? mockGameData : realGameData;
  const selectedAddresses = useMockData
    ? mockSelectedAddresses
    : realSelectedAddresses;
  const bets = useMockData ? mockBets : realBets;
  const loading = useMockData ? isLoading : realLoading;

  // Function to fetch betting amounts for selected addresses
  const fetchBettingAmounts = async () => {
    const amounts: Record<string, { up: string; down: string }> = {};

    for (let i = 0; i < selectedAddresses.length; i++) {
      try {
        const address = selectedAddresses[i];

        if (useMockData) {
          // Mock data
          const result = await mockGameService.getBettingAmounts(i);
          amounts[address] = {
            up: result.up_amount,
            down: result.down_amount,
          };
        } else {
          // Real data
          const result = await realActions.getBettingAmounts(i);
          amounts[address] = {
            up: result.up_amount,
            down: result.down_amount,
          };
        }
      } catch (error) {
        console.error("Error fetching betting amounts:", error);
      }
    }

    setBettingAmounts(amounts);
  };

  // Load data on component mount and when data source changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (useMockData) {
          // Load mock data
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
          await fetchBettingAmounts();
        } else {
          // Load real data
          await realActions.getAddresses();
          await realActions.getWindowStatus();
          await fetchBettingAmounts();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [useMockData]);

  // Handle start betting window
  const handleStartBettingWindow = async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        await mockGameService.startBettingWindow();
        setIsRoundOngoing(true);
      } else {
        await realActions.startBettingWindow();
      }
      await fetchBettingAmounts();
    } catch (error) {
      console.error("Error starting betting window:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close betting window
  const handleCloseBettingWindow = async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        await mockGameService.closeBettingWindow();
        setIsRoundOngoing(false);
      } else {
        await realActions.closeBettingWindow();
      }
    } catch (error) {
      console.error("Error closing betting window:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify and process payouts
  const handleVerifyAndProcessPayouts = async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        await mockGameService.verifyAndProcessPayouts();
      } else {
        await realActions.verifyAndProcessPayouts();
      }
    } catch (error) {
      console.error("Error verifying and processing payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock/real implementation of place bet function
  const handlePlaceBet = async (
    address: string,
    position: boolean,
    amount: string
  ) => {
    setIsLoading(true);
    try {
      if (useMockData) {
        await mockGameService.placeBet(address, position, amount);

        // Update mock bets
        const newBets = { ...mockBets };
        newBets[address] = position ? "top" : "bottom";

        // Update betting amounts - safely converting strings to BigInt
        const currentAmounts = bettingAmounts[address] || {
          up: "0",
          down: "0",
        };
        const newAmounts = { ...bettingAmounts };

        // Helper function to safely parse BigInt
        const safeParseAmount = (str: string): bigint => {
          try {
            // Ensure we're dealing with a valid numeric string
            // Remove any non-numeric characters except for a possible decimal point
            const numericStr = str.replace(/[^\d]/g, "");
            return BigInt(numericStr || "0");
          } catch (e) {
            console.error("Failed to parse amount to BigInt:", str);
            return BigInt(0);
          }
        };

        if (position) {
          newAmounts[address] = {
            ...currentAmounts,
            up: (
              safeParseAmount(currentAmounts.up) + safeParseAmount(amount)
            ).toString(),
          };
        } else {
          newAmounts[address] = {
            ...currentAmounts,
            down: (
              safeParseAmount(currentAmounts.down) + safeParseAmount(amount)
            ).toString(),
          };
        }

        setBettingAmounts(newAmounts);
        return true;
      } else {
        // Use the real placeBet action
        await realActions.placeBet(address, position, amount);
        await fetchBettingAmounts(); // Refresh amounts after placing bet
        return true;
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="game" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="game">Game</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Crypto Price Movement Game</CardTitle>
                  <CardDescription>
                    Bet on whether an address will be in the top or bottom 50%
                  </CardDescription>
                </div>
                <Badge variant={isRoundOngoing ? "default" : "outline"}>
                  {isRoundOngoing ? "Round Ongoing" : "Round Ended"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Blurry overlay when round is ongoing */}
                {isRoundOngoing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-xl font-bold shadow-lg">
                      Round Ongoing
                    </div>
                  </div>
                )}

                {/* Game leaderboard */}
                <GameLeaderboard
                  gameData={gameData}
                  selectedAddresses={selectedAddresses}
                  bets={bets}
                  onPlaceBet={handlePlaceBet}
                  isLoading={loading}
                  bettingAmounts={bettingAmounts}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleStartBettingWindow}
              disabled={
                (useMockData ? isRoundOngoing : windowActive) || loading
              }
            >
              {loading ? "Processing..." : "Start Betting Round"}
            </Button>
            <Button
              onClick={handleCloseBettingWindow}
              disabled={
                (useMockData ? !isRoundOngoing : !windowActive) || loading
              }
              variant="destructive"
            >
              {loading ? "Processing..." : "End Betting Round"}
            </Button>
            <Button
              onClick={handleVerifyAndProcessPayouts}
              disabled={
                (useMockData ? isRoundOngoing : windowActive) || loading
              }
              variant="outline"
            >
              {loading ? "Processing..." : "Verify & Process Payouts"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>
                Configure data source and game behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">Data Source</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch between mock and real data
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mock-data-toggle"
                    checked={useMockData}
                    onCheckedChange={setUseMockData}
                  />
                  <Label htmlFor="mock-data-toggle">
                    {useMockData ? "Mock Data" : "Real Data"}
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">Round Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Manually toggle round status (mock data only)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="round-toggle"
                    checked={isRoundOngoing}
                    onCheckedChange={setIsRoundOngoing}
                    disabled={!useMockData}
                  />
                  <Label htmlFor="round-toggle">
                    {isRoundOngoing ? "Round Ongoing" : "Round Ended"}
                  </Label>
                </div>
              </div>

              <div className="pt-2">
                <Alert>
                  <AlertDescription>
                    When using real data, actions and state will be managed by
                    the blockchain. Window status and betting actions will cause
                    actual transactions.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
