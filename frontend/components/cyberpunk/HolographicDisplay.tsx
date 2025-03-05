import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { chakra } from "@/lib/fonts";

interface HolographicDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  loading?: boolean;
  variant?: "cyan" | "magenta" | "green" | "yellow";
  scanlines?: boolean;
  hologramEffect?: boolean;
  stats?: Array<{ label: string; value: string | number }>;
  borderEffect?: "dashed" | "double" | "pulsing" | "none";
  floatingNodesCount?: number;
}

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

export const HolographicDisplay = ({
  title,
  loading = false,
  variant = "cyan",
  scanlines = true,
  hologramEffect = true,
  stats,
  borderEffect = "pulsing",
  floatingNodesCount = 20,
  className,
  children,
  ...props
}: HolographicDisplayProps) => {
  const displayRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [mouseOver, setMouseOver] = useState(false);
  const [nodes, setNodes] = useState<CircuitNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Colors based on variant
  const variantColors = {
    cyan: {
      primary: "#00FFFF",
      glow: "rgba(0, 255, 255, 0.5)",
      border: "rgba(0, 255, 255, 0.7)",
      text: "text-cyan-300",
      bg: "rgba(0, 255, 255, 0.05)",
      gradient: "from-cyan-500/20 to-blue-500/10",
      scanlines: "rgba(0, 255, 255, 0.1)",
    },
    magenta: {
      primary: "#FF00FF",
      glow: "rgba(255, 0, 255, 0.5)",
      border: "rgba(255, 0, 255, 0.7)",
      text: "text-pink-300",
      bg: "rgba(255, 0, 255, 0.05)",
      gradient: "from-fuchsia-500/20 to-purple-500/10",
      scanlines: "rgba(255, 0, 255, 0.1)",
    },
    green: {
      primary: "#00FF00",
      glow: "rgba(0, 255, 0, 0.5)",
      border: "rgba(0, 255, 0, 0.7)",
      text: "text-green-300",
      bg: "rgba(0, 255, 0, 0.05)",
      gradient: "from-green-500/20 to-emerald-500/10",
      scanlines: "rgba(0, 255, 0, 0.1)",
    },
    yellow: {
      primary: "#FFFF00",
      glow: "rgba(255, 255, 0, 0.5)",
      border: "rgba(255, 255, 0, 0.7)",
      text: "text-yellow-200",
      bg: "rgba(255, 255, 0, 0.05)",
      gradient: "from-yellow-500/20 to-amber-500/10",
      scanlines: "rgba(255, 255, 0, 0.1)",
    },
  };

  // Initialize floating nodes
  useEffect(() => {
    if (!displayRef.current) return;

    const { width, height } = displayRef.current.getBoundingClientRect();
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
      if (!displayRef.current) return;
      const { width, height } = displayRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [floatingNodesCount]);

  // Animate nodes
  useEffect(() => {
    if (!displayRef.current || nodes.length === 0 || dimensions.width === 0)
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

  // 3D rotation effect
  useEffect(() => {
    if (!displayRef.current || !hologramEffect) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!displayRef.current || !mouseOver) return;

      const { left, top, width, height } =
        displayRef.current.getBoundingClientRect();

      // Calculate rotation based on mouse position
      const x = ((e.clientY - top - height / 2) / (height / 2)) * 5;
      const y = (-(e.clientX - left - width / 2) / (width / 2)) * 5;

      setRotation({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hologramEffect, mouseOver]);

  // Border styles based on the selected effect
  const borderStyles = {
    dashed: `border-dashed border-2 border-${variantColors[variant].border}`,
    double: `border-double border-4 border-${variantColors[variant].border}`,
    pulsing: "border-2",
    none: "border-0",
  };

  return (
    <div
      ref={displayRef}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => {
        setMouseOver(false);
        setRotation({ x: 0, y: 0 });
      }}
      className={cn(
        "relative rounded-lg overflow-hidden transition-all duration-300",
        borderEffect !== "none" && "border",
        borderEffect === "pulsing" && "animate-border-pulse",
        className
      )}
      style={{
        backgroundColor: variantColors[variant].bg,
        borderColor: variantColors[variant].border,
        boxShadow: `0 0 15px ${variantColors[variant].glow}`,
        transform: hologramEffect
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
          : "none",
      }}
      {...props}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${variantColors[variant].gradient} z-0`}
      ></div>

      {/* Scanlines effect */}
      {scanlines && (
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 0%, ${variantColors[variant].scanlines} 50%, transparent 100%)`,
            backgroundSize: "100% 4px",
          }}
        ></div>
      )}

      {/* Floating circuit nodes */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute rounded-full"
            style={{
              backgroundColor: variantColors[variant].primary,
              width: `${node.size}px`,
              height: `${node.size}px`,
              left: `${node.x}px`,
              top: `${node.y}px`,
              boxShadow: `0 0 5px ${variantColors[variant].glow}`,
              opacity: node.opacity,
              animation: `pulse ${node.pulseSpeed}s ease-in-out infinite`,
              transition: "all 0.5s linear",
            }}
          ></div>
        ))}

        {/* Connection lines - Restructured to connect to floating points */}
        {/* <svg className="absolute inset-0 w-full h-full z-0">
          <g
            stroke={variantColors[variant].primary}
            strokeWidth="0.5"
            opacity="0.3"
          >
            {nodes.length >= 6 && (
              <>
                <line
                  x1={nodes[0].x}
                  y1={nodes[0].y}
                  x2={nodes[1].x}
                  y2={nodes[1].y}
                />
                <line
                  x1={nodes[1].x}
                  y1={nodes[1].y}
                  x2={nodes[2].x}
                  y2={nodes[2].y}
                />
                <line
                  x1={nodes[2].x}
                  y1={nodes[2].y}
                  x2={nodes[3].x}
                  y2={nodes[3].y}
                />
                <line
                  x1={nodes[3].x}
                  y1={nodes[3].y}
                  x2={nodes[4].x}
                  y2={nodes[4].y}
                />
                <line
                  x1={nodes[4].x}
                  y1={nodes[4].y}
                  x2={nodes[5].x}
                  y2={nodes[5].y}
                />
                <line
                  x1={nodes[5].x}
                  y1={nodes[5].y}
                  x2={nodes[0].x}
                  y2={nodes[0].y}
                />
              </>
            )}
          </g>
        </svg> */}
      </div>

      {/* Header */}
      {title && (
        <div
          className="relative z-20 p-3 border-b"
          style={{ borderColor: variantColors[variant].border }}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`font-bold text-xl ${chakra.className} ${variantColors[variant].text}`}
              style={{ textShadow: `0 0 5px ${variantColors[variant].glow}` }}
            >
              {title}
            </h3>

            {/* Status indicator */}
            {/* <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  loading ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: variantColors[variant].primary,
                  boxShadow: `0 0 5px ${variantColors[variant].glow}`,
                }}
              ></div>
              <span className={`ml-2 text-xs ${variantColors[variant].text}`}>
                {loading ? "PROCESSING" : "READY"}
              </span>
            </div> */}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-20 p-4">{children}</div>

      {/* Stats footer */}
      {stats && stats.length > 0 && (
        <div
          className="relative z-20 p-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2"
          style={{ borderColor: variantColors[variant].border }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-xs text-white opacity-70`}>
                {stat.label}
              </div>
              <div
                className={`text-sm font-mono font-bold ${variantColors[variant].text}`}
                style={{ textShadow: `0 0 5px ${variantColors[variant].glow}` }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Corner accents */}
      <div
        className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 z-30"
        style={{ borderColor: variantColors[variant].primary }}
      ></div>
      <div
        className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 z-30"
        style={{ borderColor: variantColors[variant].primary }}
      ></div>
      <div
        className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 z-30"
        style={{ borderColor: variantColors[variant].primary }}
      ></div>
      <div
        className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 z-30"
        style={{ borderColor: variantColors[variant].primary }}
      ></div>

      {/* Glitch effect when loading */}
      {loading && (
        <div
          className="absolute inset-0 z-30 pointer-events-none opacity-10 animate-glitch"
          style={{
            backgroundImage: `linear-gradient(90deg, ${variantColors[variant].primary} 10%, transparent 10%, transparent 20%, ${variantColors[variant].primary} 20%, ${variantColors[variant].primary} 30%, transparent 30%, transparent 40%, ${variantColors[variant].primary} 40%, ${variantColors[variant].primary} 50%, transparent 50%, transparent 60%, ${variantColors[variant].primary} 60%, ${variantColors[variant].primary} 70%, transparent 70%, transparent 80%, ${variantColors[variant].primary} 80%, ${variantColors[variant].primary} 90%, transparent 90%)`,
            backgroundSize: "200% 100%",
            animation: "glitch 1s linear infinite",
          }}
        ></div>
      )}
    </div>
  );
};

export default HolographicDisplay;
