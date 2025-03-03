"use client";

import { useState } from "react";
import { Tower, Position } from "@/lib/types/core";
import { useGameEngine } from "@/lib/hooks/useGameEngine";

interface GridCellProps {
  position: Position;
  tower?: Tower;
  onCellClick: (position: Position) => void;
}

const GridCell: React.FC<GridCellProps> = ({
  position,
  tower,
  onCellClick,
}) => {
  const getBgColor = (tower?: Tower) => {
    if (!tower) return "bg-gray-800";
    switch (tower.type) {
      case "validator":
        return "bg-blue-600";
      case "lp":
        return "bg-purple-600";
      case "lending":
        return "bg-green-600";
      case "yield":
        return "bg-yellow-600";
    }
  };

  return (
    <div
      className={`aspect-square border border-gray-700 ${getBgColor(tower)} 
        hover:opacity-80 cursor-pointer transition-all`}
      onClick={() => onCellClick(position)}
    >
      {tower && (
        <div className="w-full h-full flex flex-col items-center justify-center text-white">
          <span className="text-xs">Lvl {tower.level}</span>
          <span className="text-xs">{tower.yieldPerHour}/h</span>
        </div>
      )}
    </div>
  );
};

const DOMRenderer: React.FC = () => {
  const { gameState, placeTower } = useGameEngine();
  console.log(`Game state`, gameState);
  const [selectedTowerType, setSelectedTowerType] =
    useState<Tower["type"]>("validator");

  const handleCellClick = (position: Position) => {
    placeTower(selectedTowerType, position);
  };

  if (!gameState) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Game Stats */}
      <div className="flex justify-between mb-4 p-4 bg-gray-800 rounded">
        <div>Wave: {gameState.wave}</div>
        <div>Resources: {gameState.resources}</div>
        <div>Health: {gameState.health}</div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-12 gap-1 mb-4">
        {Array.from({ length: 144 }).map((_, i) => {
          const position = { x: i % 12, y: Math.floor(i / 12) };
          const tower = gameState.towers.find(
            (t) => t.position.x === position.x && t.position.y === position.y
          );
          return (
            <GridCell
              key={`${position.x}-${position.y}`}
              position={position}
              tower={tower}
              onCellClick={handleCellClick}
            />
          );
        })}
      </div>

      {/* Tower Selection */}
      <div className="flex justify-center gap-4 p-4 bg-gray-800 rounded">
        {(["validator", "lp", "lending", "yield"] as const).map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded capitalize ${
              selectedTowerType === type ? "bg-blue-500" : "bg-gray-600"
            }`}
            onClick={() => setSelectedTowerType(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DOMRenderer;
