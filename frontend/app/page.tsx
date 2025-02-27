"use client";

import DOMRenderer from "@/components/game/DOMRenderer";
import GameDashboard from "@/components/dashboard/GameDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Node Defenders</h1>

      <Tabs defaultValue="game" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="game">Game</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="game">
          <DOMRenderer />
        </TabsContent>

        <TabsContent value="dashboard">
          <GameDashboard />
        </TabsContent>
      </Tabs>
    </main>
  );
}
