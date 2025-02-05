import { useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { GameConfig, Tower, Position } from "../types/core";
import { GameState } from "../types/gameState";

const DEFAULT_CONFIG: GameConfig = {
  gridSize: 12,
  baseHealth: 100,
  initialResources: 1000,
  waveDuration: 60,
};

export function useGameEngine(config: Partial<GameConfig> = {}) {
  const engineRef = useRef<GameEngine>();
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Initialize engine with merged config
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    engineRef.current = new GameEngine(finalConfig);

    // Subscribe to state updates
    const unsubscribe = engineRef.current.subscribe(setGameState);
    return unsubscribe;
  }, []);

  return {
    gameState,
    engine: engineRef.current,
    // Add convenience methods here
    placeTower: (type: Tower["type"], position: Position) =>
      engineRef.current?.placeTower(type, position),
    upgradeTower: (towerId: string) => engineRef.current?.upgradeTower(towerId),
    harvestYield: (towerId: string) => engineRef.current?.harvestYield(towerId),
  };
}
