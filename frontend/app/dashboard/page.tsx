"use client";

import { EnhancedLiquidityPoolCard } from "@/components/EnhancedLiquidityPoolCard";
import { GameLiquidityPoolCard } from "@/components/GameLiquidityPoolCard";
import { LiquidityPoolCard } from "@/components/LiquidityPoolCard";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">DeFi Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Liquidity Pool Card */}
          {/* <LiquidityPoolCard /> */}
          {/* <EnhancedLiquidityPoolCard /> */}
          <GameLiquidityPoolCard />
          {/* Additional cards can go here */}
          <div className="w-full h-full min-h-[300px] rounded-lg border bg-card text-card-foreground shadow flex items-center justify-center">
            <p className="text-muted-foreground">Additional Pool Stats</p>
          </div>

          <div className="w-full h-full min-h-[300px] rounded-lg border bg-card text-card-foreground shadow flex items-center justify-center">
            <p className="text-muted-foreground">Performance Metrics</p>
          </div>
        </div>
      </div>
    </main>
  );
}
