"use client";

import { useGameEngine } from "@/app/lib/hooks/useGameEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GameDashboard: React.FC = () => {
  const { gameState, harvestYield } = useGameEngine();

  if (!gameState) return null;

  return (
    <div className="space-y-6">
      {/* DeFi Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gameState.towers.reduce((sum, t) => sum + t.yieldPerHour, 0)}{" "}
              /hour
            </div>
          </CardContent>
        </Card>
        {/* Add more DeFi stats cards */}
      </div>

      {/* Tower Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Your Towers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState.towers.map((tower) => (
              <Card key={tower.id} className="bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold capitalize">{tower.type}</h3>
                    <button
                      onClick={() => harvestYield(tower.id)}
                      className="px-3 py-1 bg-green-600 rounded"
                    >
                      Harvest
                    </button>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Level: {tower.level}</p>
                    <p>Yield: {tower.yieldPerHour}/hour</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameDashboard;
