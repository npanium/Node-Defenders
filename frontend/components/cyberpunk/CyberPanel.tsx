import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { chakra } from "@/lib/fonts";
import { ShipWheel } from "lucide-react";

// Circuit node with position and animation data
interface CircuitNode {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: { x: number; y: number };
  pulseSpeed: number;
  opacity: number;
}

export interface CyberPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerContent?: React.ReactNode;
  variant?: "cyan" | "pink" | "green" | "yellow" | "purple";
  fullHeight?: boolean;
  floatingNodesCount?: number;
}

export const CyberPanel = ({
  title,
  headerContent,
  variant = "cyan",
  fullHeight = false,
  floatingNodesCount = 15,
  className,
  children,
  ...props
}: CyberPanelProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [nodes, setNodes] = useState<CircuitNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Map variant to tailwind classes
  const variantMap = {
    cyan: {
      border: "border-cyan-500/30",
      text: "text-cyan-300",
      shadow: "shadow-cyan-900/20",
      divider: "border-cyan-500/20",
      headerGradient: "bg-gradient-to-tr from-blue-950 to-blue-800",
      primary: "#00FFFF",
      glow: "rgba(0, 255, 255, 0.5)",
    },
    pink: {
      border: "border-pink-500/30",
      text: "text-pink-300",
      shadow: "shadow-pink-900/20",
      divider: "border-pink-500/20",
      headerGradient: "bg-gradient-to-tr from-pink-950 to-pink-800",
      primary: "#FF00FF",
      glow: "rgba(255, 0, 255, 0.5)",
    },
    green: {
      border: "border-green-500/30",
      text: "text-green-300",
      shadow: "shadow-green-900/20",
      divider: "border-green-500/20",
      headerGradient: "bg-gradient-to-tr from-green-950 to-green-800",
      primary: "#00FF00",
      glow: "rgba(0, 255, 0, 0.5)",
    },
    yellow: {
      border: "border-yellow-500/30",
      text: "text-yellow-300",
      shadow: "shadow-yellow-900/20",
      divider: "border-yellow-500/20",
      headerGradient: "bg-gradient-to-tr from-yellow-950 to-amber-800",
      primary: "#FFFF00",
      glow: "rgba(255, 255, 0, 0.5)",
    },
    purple: {
      border: "border-purple-500/30",
      text: "text-purple-300",
      shadow: "shadow-purple-900/20",
      divider: "border-purple-500/20",
      headerGradient: "bg-gradient-to-tr from-purple-950 to-purple-800",
      primary: "#A020F0",
      glow: "rgba(160, 32, 240, 0.5)",
    },
  };

  // Initialize floating nodes
  useEffect(() => {
    if (!headerRef.current) return;

    const { width, height } = headerRef.current.getBoundingClientRect();
    setDimensions({ width, height });

    // Create initial nodes
    const initialNodes: CircuitNode[] = Array(floatingNodesCount)
      .fill(0)
      .map((_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1, // Size between 1-3px
        speed: {
          x: (Math.random() - 0.5) * 0.5, // Speed between -0.25 and 0.25
          y: (Math.random() - 0.5) * 0.5,
        },
        pulseSpeed: Math.random() * 2 + 1, // Pulse speed variation
        opacity: Math.random() * 0.5 + 0.5, // Opacity between 0.5-1
      }));

    setNodes(initialNodes);

    // Handle resize
    const handleResize = () => {
      if (!headerRef.current) return;
      const { width, height } = headerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [floatingNodesCount]);

  // Animate nodes
  useEffect(() => {
    if (!headerRef.current || nodes.length === 0 || dimensions.width === 0)
      return;

    const animate = () => {
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          // Update position
          let newX = node.x + node.speed.x;
          let newY = node.y + node.speed.y;

          // Bounce off walls
          if (newX <= 0 || newX >= dimensions.width) {
            node.speed.x *= -1;
            newX = Math.max(0, Math.min(newX, dimensions.width));
          }

          if (newY <= 0 || newY >= dimensions.height) {
            node.speed.y *= -1;
            newY = Math.max(0, Math.min(newY, dimensions.height));
          }

          return {
            ...node,
            x: newX,
            y: newY,
          };
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, dimensions]);

  return (
    <div
      className={cn(
        "bg-slate-900/80 backdrop-blur-sm border",
        variantMap[variant].border,
        `shadow-lg ${variantMap[variant].shadow}`,
        fullHeight ? "h-full" : "",
        "overflow-hidden rounded-lg",
        className
      )}
      {...props}
    >
      {(title || headerContent) && (
        <div
          ref={headerRef}
          className={`${chakra.className} relative border-b ${variantMap[variant].divider} pb-3 px-4 pt-4 flex justify-between items-center ${variantMap[variant].headerGradient}`}
        >
          {/* Floating nodes in the header */}
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute rounded-full"
                style={{
                  backgroundColor: variantMap[variant].primary,
                  width: `${node.size}px`,
                  height: `${node.size}px`,
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  boxShadow: `0 0 5px ${variantMap[variant].glow}`,
                  opacity: node.opacity,
                  animation: `pulse ${node.pulseSpeed}s ease-in-out infinite`,
                  transition: "all 0.5s linear",
                }}
              ></div>
            ))}
          </div>

          {/* Header content */}
          <div className="z-10 relative flex gap-2 items-center group cursor-default">
            {title && (
              <>
                <ShipWheel
                  className="h-6 w-6 text-cyan-500 group-hover:animate-[spin_4s_linear_infinite]"
                  style={{
                    textShadow: "0px 0px 10px #51a2ff",
                  }}
                />
                <h2
                  className={`text-2xl font-semibold ${variantMap[variant].text}`}
                  style={{ textShadow: "0px 0px 15px #51a2ff" }}
                >
                  {title}
                </h2>
              </>
            )}
          </div>

          {headerContent && (
            <div className="z-10 relative">{headerContent}</div>
          )}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
