"use client";

import { useState, useEffect } from "react";
import GameDashboard from "@/components/dashboard/GameDashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import GameLeaderboardPageComponent from "@/components/GameLeaderboardPageComponent";
import { GameControlCard } from "@/components/GameControlCard";
import { chakra } from "@/lib/fonts";

// New components for cyberpunk theme
import { UnityGameComponent } from "@/components/UnityGameComponent";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

import NodePoolManager from "@/components/NodePoolManager";

export default function Home() {
  // State for game controls
  const [gameStarted, setGameStarted] = useState(false);
  const [roundOngoing, setRoundOngoing] = useState(false);

  // Toggle game state
  const toggleGame = () => {
    setGameStarted(!gameStarted);
    if (!gameStarted) {
      setRoundOngoing(true);
    }
  };

  // Toggle round
  const toggleRound = () => {
    setRoundOngoing(!roundOngoing);
  };

  return (
    <div>
      <main className="mx-auto relative z-10">
        <Navbar />

        <div className="container grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            {/* <Card className="bg-slate-900/60 backdrop-blur-sm border-indigo-500/30 shadow-lg shadow-indigo-900/20 overflow-hidden">
              <CardHeader className="border-b border-indigo-500/20 pb-3">
                <h2 className="text-xl font-semibold text-cyan-300">
                  Game Controls
                </h2>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Mock Data</span>
                    <Toggle
                      pressed={useMockData}
                      onPressedChange={setUseMockData}
                      className="bg-slate-800/70 border border-indigo-500/50 hover:bg-indigo-900/50 data-[state=on]:bg-indigo-600"
                    >
                      {useMockData ? "ON" : "OFF"}
                    </Toggle>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Game Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        gameStarted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {gameStarted ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Round Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        roundOngoing
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {roundOngoing ? "ONGOING" : "COMPLETED"}
                    </span>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <Button
                      onClick={toggleGame}
                      className={`w-full ${
                        gameStarted
                          ? "bg-red-600 hover:bg-red-500 border-red-500/50 shadow-red-600/30"
                          : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-600/30"
                      } rounded-lg text-white font-medium transition-all shadow-lg border`}
                    >
                      {gameStarted ? "Stop Game" : "Start Game"}
                    </Button>

                    <Button
                      onClick={toggleRound}
                      className={`w-full ${
                        roundOngoing
                          ? "bg-amber-600 hover:bg-amber-500 border-amber-500/50 shadow-amber-600/30"
                          : "bg-blue-600 hover:bg-blue-500 border-blue-500/50 shadow-blue-600/30"
                      } rounded-lg text-white font-medium transition-all shadow-lg border`}
                      disabled={!gameStarted}
                    >
                      {roundOngoing ? "End Round" : "New Round"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            <div className="mt-0 flex flex-col gap-4">
              <GameControlCard />
              <NodePoolManager />
            </div>
          </div>

          {/* Center - Game area */}
          <div className="md:col-span-6">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-indigo-500 shadow-lg shadow-indigo-900/20 h-[80vh] flex flex-col rounded-xl overflow-hidden">
              <UnityGameComponent />

              {/* Blur overlay for round ongoing */}
              {gameStarted && roundOngoing && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="inline-block py-3 px-6 bg-indigo-600/80 rounded-lg border border-indigo-400/30 shadow-lg shadow-indigo-600/30 mb-4">
                      <span className="text-2xl font-bold text-white">
                        Round Ongoing
                      </span>
                    </div>
                    <p className="text-cyan-300">
                      Please wait until the current round is complete
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar - Leaderboard */}
          <div className="md:col-span-3">
            <Card className="bg-slate-900/60 backdrop-blur-sm border-indigo-500/30 shadow-lg shadow-indigo-900/20 h-full">
              <CardHeader className="border-b border-indigo-500/20 pb-3">
                <h2 className="text-xl font-semibold text-cyan-300">
                  Game Leaderboard
                </h2>
              </CardHeader>
              <CardContent className="pt-4 relative">
                <GameLeaderboardPageComponent />

                {/* Blur overlay for round ongoing */}
                {roundOngoing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="py-3 px-6 bg-indigo-600/80 rounded-lg border border-indigo-400/30 shadow-lg shadow-indigo-600/30">
                      <span className="text-xl font-bold text-white">
                        Round Ongoing
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
