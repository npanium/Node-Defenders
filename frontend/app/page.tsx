"use client";

import GameDashboard from "@/components/dashboard/GameDashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import GameLeaderboardPageComponent from "@/components/GameLeaderboardPageComponent";
import { chakra } from "@/lib/fonts";
import { GameLiquidityPoolCard } from "@/components/GameLiquidityPoolCard";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className={`text-3xl font-bold mb-6 ${chakra.className}`}>
        Node Defenders
      </h1>
      <GameLiquidityPoolCard />
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold">Game Leaderboard</h2>
        </CardHeader>
        <CardContent>
          {/* <GameLeaderboard
                gameData={gameData}
                // activeStep={activeStep}
                selectedAddresses={selectedAddresses}
                bets={bets}
                onPlaceBet={actions.placeBet}
              /> */}
          <GameLeaderboardPageComponent />
        </CardContent>
      </Card>
    </main>
  );
}
