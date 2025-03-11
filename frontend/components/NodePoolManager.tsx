import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { NodePool, NodeType } from "./NodePool";
import CyberPoolPanel from "./cyberpunk/CyberPoolPanel";
import useSocket from "@/lib/hooks/useSocket";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Generate a random ID for nodes
const generateId = () => Math.random().toString(36).substring(2, 10);

// Initial node stats
const getInitialNodeStats = (type: NodeType) => {
  switch (type) {
    case "validator":
      return { damage: 3, range: 2.5, speed: 4, efficiency: 5 };
    case "harvester":
      return { damage: 2, range: 2, speed: 3, efficiency: 7 };
    case "defender":
      return { damage: 4, range: 5, speed: 2, efficiency: 3 };
    case "attacker":
      return { damage: 7, range: 3, speed: 5, efficiency: 2 };
    default:
      return { damage: 3, range: 3, speed: 3, efficiency: 3 };
  }
};

// Node type info for display
const nodeTypeInfo = {
  validator: {
    title: "Validator Node",
    description: "Validates transactions and secures the network",
    color: "cyan",
  },
  harvester: {
    title: "Harvester Node",
    description: "Extracts resources from the blockchain",
    color: "green",
  },
  defender: {
    title: "Defender Node",
    description: "Protects against network attacks",
    color: "purple",
  },
  attacker: {
    title: "Attacker Node",
    description: "Launches offensive measures against enemies",
    color: "pink",
  },
};

interface Node {
  id: string;
  type: NodeType;
  poolSize: number;
  stakedTokens: { gods: number; soul: number };
  stats: {
    damage: number;
    range: number;
    speed: number;
    efficiency: number;
  };
}

// Map backend node types to frontend types
const mapNodeType = (type: string): NodeType => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("validator")) return "validator";
  if (lowerType.includes("harvester")) return "harvester";
  if (lowerType.includes("defender")) return "defender";
  if (lowerType.includes("attacker")) return "attacker";
  return "validator"; // Default
};

const NodePoolManager: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Connect to the WebSocket
  const { gameState, selectNode } = useSocket();

  // Effect to sync nodes from gameState
  useEffect(() => {
    if (!gameState || !gameState.nodes) return;

    // Convert server nodes to our frontend format
    const serverNodes = gameState.nodes;
    const updatedNodes: Node[] = [];

    Object.keys(serverNodes).forEach((nodeId) => {
      const serverNode = serverNodes[nodeId];

      // Check if we already have this node in our state
      const existingNodeIndex = nodes.findIndex((n) => n.id === nodeId);

      if (existingNodeIndex >= 0) {
        // Update existing node
        updatedNodes.push({
          ...nodes[existingNodeIndex],
          type: mapNodeType(serverNode.type),
        });
      } else {
        // Create new node
        updatedNodes.push({
          id: nodeId,
          type: mapNodeType(serverNode.type),
          poolSize: 100, // Default size
          stakedTokens: { gods: 0, soul: 0 },
          stats:
            serverNode.stats ||
            getInitialNodeStats(mapNodeType(serverNode.type)),
        });
      }
    });

    setNodes(updatedNodes);
  }, [gameState.nodes]);

  // Effect to handle node selection from the game
  useEffect(() => {
    if (gameState.selectedNodeId !== selectedNodeId) {
      setSelectedNodeId(gameState.selectedNodeId);

      // Auto-expand the selected node's accordion
      if (gameState.selectedNodeId) {
        // Implementation depends on your accordion library
        // Here we're assuming the accordion is controlled by the value prop
      }
    }
  }, [gameState.selectedNodeId]);

  // Remove a node
  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));

    // Also notify the game if needed
    // TODO: Add code to notify the game about node removal
  };

  // Handle node selection in the UI
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    selectNode(nodeId);
  };

  // Handle staking
  const handleStake = (
    nodeId: string,
    tokenType: "gods" | "soul",
    amount: number
  ) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;

        // Update the staked tokens
        const updatedTokens = {
          ...node.stakedTokens,
          [tokenType]: node.stakedTokens[tokenType] + amount,
        };

        // Update stats based on token type
        const updatedStats = { ...node.stats };

        if (tokenType === "gods") {
          updatedStats.damage += amount * 0.1;
        } else {
          updatedStats.range += amount * 0.1;
          updatedStats.speed += amount * 0.05;
        }

        return {
          ...node,
          stakedTokens: updatedTokens,
          stats: updatedStats,
        };
      })
    );
  };

  // Handle unstaking
  const handleUnstake = (
    nodeId: string,
    tokenType: "gods" | "soul",
    amount: number
  ) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;

        // Update the staked tokens
        const updatedTokens = {
          ...node.stakedTokens,
          [tokenType]: Math.max(0, node.stakedTokens[tokenType] - amount),
        };

        // Update stats based on token type
        const updatedStats = { ...node.stats };

        if (tokenType === "gods") {
          updatedStats.damage = Math.max(1, updatedStats.damage - amount * 0.1);
        } else {
          updatedStats.range = Math.max(1, updatedStats.range - amount * 0.1);
          updatedStats.speed = Math.max(1, updatedStats.speed - amount * 0.05);
        }

        return {
          ...node,
          stakedTokens: updatedTokens,
          stats: updatedStats,
        };
      })
    );
  };

  // Format numbers to look cleaner
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full mx-auto">
      <CyberPoolPanel title="Pools Manager" variant="cyan">
        <div className="flex justify-between mb-4">
          <p className="text-sm font-medium text-foreground/60">
            Active Nodes:
          </p>
          <Badge variant="outline" className="px-2 py-0">
            {nodes.length} {nodes.length === 1 ? "Node" : "Nodes"}
          </Badge>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700/50">
            <p className="text-slate-400">No nodes placed yet</p>
            <p className="text-slate-400 mt-2">
              Place nodes in the game to see them here
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
            value={selectedNodeId || undefined}
          >
            {nodes.map((node) => {
              const nodeInfo = nodeTypeInfo[node.type];
              const isSelected = node.id === selectedNodeId;

              return (
                <AccordionItem
                  key={node.id}
                  value={node.id}
                  className={`border ${
                    isSelected
                      ? `border-${nodeInfo.color}-500`
                      : `border-${nodeInfo.color}-500/30`
                  } rounded-lg ${
                    isSelected ? `ring-1 ring-${nodeInfo.color}-400` : ""
                  }`}
                >
                  <AccordionTrigger
                    className={`p-3 hover:bg-slate-800/50 ${
                      isSelected ? `bg-slate-800/80` : `bg-slate-900/50`
                    } hover:no-underline`}
                    onClick={() => handleNodeSelect(node.id)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full bg-${nodeInfo.color}-500`}
                        ></div>
                        <span
                          className={`text-${nodeInfo.color}-300 font-medium`}
                        >
                          {nodeInfo.title} #{node.id.substring(0, 4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Pool: {formatNumber(node.poolSize)}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNode(node.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-2">
                    <div className="relative">
                      <NodePool
                        nodeId={node.id}
                        nodeType={node.type}
                        poolSize={node.poolSize}
                        stakedTokens={node.stakedTokens}
                        nodeStats={node.stats}
                        onStake={(tokenType, amount) =>
                          handleStake(node.id, tokenType, amount)
                        }
                        onUnstake={(tokenType, amount) =>
                          handleUnstake(node.id, tokenType, amount)
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CyberPoolPanel>
    </div>
  );
};

export default NodePoolManager;
