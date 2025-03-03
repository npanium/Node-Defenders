"use client";

import { useGameEngine } from "@/lib/hooks/useGameEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLiquidityPoolCard } from "../GameLiquidityPoolCard";

const GameDashboard: React.FC = () => {
  const { gameState, harvestYield } = useGameEngine();

  if (!gameState) return null;

  return (
    <div>
      <GameLiquidityPoolCard />
    </div>
  );
};

export default GameDashboard;
