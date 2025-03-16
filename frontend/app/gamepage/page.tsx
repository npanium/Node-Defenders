"use client";
import { useState, useEffect } from "react";
import GameDashboard from "@/components/dashboard/GameDashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import GameLeaderboardPageComponent from "@/components/GameLeaderboardPageComponent";
import { GameControlCard } from "@/components/GameControlCard";
import { UnityGameComponent } from "@/components/UnityGameComponent";
import Navbar from "@/components/Navbar";
import NodePoolManager from "@/components/NodePoolManager";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi"; // Import useAccount hook

export default function Home() {
  // State for game controls
  const [gameStarted, setGameStarted] = useState(false);
  const [roundOngoing, setRoundOngoing] = useState(false);

  // Use wagmi's useAccount hook to check wallet connection
  const { isConnected, address } = useAccount();

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
          {/* Left sidebar */}
          <div className="md:col-span-3">
            <div className="mt-0 flex flex-col gap-4">
              {isConnected ? (
                <>
                  <GameControlCard />
                  <NodePoolManager />
                </>
              ) : (
                <>
                  <Card className="bg-slate-900/60 backdrop-blur-sm border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                    <CardContent className="p-4">
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/60 backdrop-blur-sm border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                    <CardContent className="p-4">
                      <Skeleton className="h-[300px] w-full rounded-lg" />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Center - Game area */}
          <div className="md:col-span-6">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-indigo-500 shadow-lg shadow-indigo-900/20 h-[80vh] flex flex-col rounded-xl overflow-hidden">
              {isConnected ? (
                <UnityGameComponent />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-md"></div>
                  <div className="z-10 text-center p-6">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-4">
                      Connect Your Wallet
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Connect your wallet to start playing the game
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar - Leaderboard */}
          <div className="md:col-span-3">
            <Card className="bg-slate-900/60 backdrop-blur-sm border-indigo-500/30 shadow-lg shadow-indigo-900/20 h-[50vh]">
              <CardHeader className="border-b border-indigo-500/20 pb-3">
                <h2 className="text-xl font-semibold text-cyan-300">
                  Game Leaderboard
                </h2>
                <p>Coming Soon!</p>
              </CardHeader>
              <CardContent
                className={
                  isConnected
                    ? "relative"
                    : "relative blur-md pointer-events-none"
                }
              >
                {/* <GameLeaderboardPageComponent /> */}
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="h-[80%] w-[90%] rounded-lg" />
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
