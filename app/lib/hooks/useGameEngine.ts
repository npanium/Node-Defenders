import { useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { GameConfig, Position, Tower } from "../types/core";
import { GameState } from "../types/gameState";

const DEFAULT_CONFIG: GameConfig = {
  gridSize: 12,
  baseHealth: 100,
  initialResources: 1000,
  waveDuration: 60,
};

// Create a singleton instance of GameEngine
let engineInstance: GameEngine | null = null;

export function useGameEngine(config: Partial<GameConfig> = {}) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Initialize engine if it doesn't exist
    if (!engineInstance) {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      engineInstance = new GameEngine(finalConfig);
    }

    // Set initial state
    setGameState(engineInstance.getState());

    // Subscribe to state updates
    const cleanupFunction = engineInstance.subscribe((state) => {
      setGameState(state);
    });

    return () => {
      cleanupFunction();
    };
  }, []);

  return {
    gameState,
    engine: engineInstance,
    placeTower: (type: Tower["type"], position: Position) =>
      engineInstance?.placeTower(type, position),
    upgradeTower: (towerId: string) => engineInstance?.upgradeTower(towerId),
    harvestYield: (towerId: string) => engineInstance?.harvestYield(towerId),
    startWave: () => engineInstance?.startWave(),
  };
}
