"use client";

import { useGameEngine } from "@/lib/hooks/useGameEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameControlCard } from "../GameControlCard";

const GameDashboard: React.FC = () => {
  const { gameState, harvestYield } = useGameEngine();

  if (!gameState) return null;

  return (
    <div>
      <GameControlCard />
    </div>
  );
};

export default GameDashboard;
