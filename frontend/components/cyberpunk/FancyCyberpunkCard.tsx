import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FancyCyberpunkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: "default" | "cyan" | "magenta" | "green" | "gold";
  glitchEffect?: boolean;
  pulsate?: boolean;
  cornerAccent?: boolean;
  circuitPattern?: boolean;
}

export const FancyCyberpunkCard = ({
  title,
  subtitle,
  variant = "default",
  glitchEffect = false,
  pulsate = true,
  cornerAccent = false,
  circuitPattern = true,
  className,
  children,
  ...props
}: FancyCyberpunkCardProps) => {
  const [glitchActive, setGlitchActive] = useState(false);

  // Color configurations based on variant
  const colors = {
    default: {
      primary: "",
      glow: "cyan-400",
      accent: "cyan-300",
      text: "cyan-300",
      border: "",
      circuit: "rgba(225, 29, 72, 0.12)",
    },
    cyan: {
      primary: "from-cyan-500 to-blue-600",
      glow: "cyan-400",
      accent: "cyan-300",
      text: "cyan-300",
      border: "cyan-500",
      circuit: "rgba(0, 255, 255, 0.07)",
    },
    magenta: {
      primary: "from-fuchsia-500 to-purple-600",
      glow: "fuchsia-400",
      accent: "pink-300",
      text: "pink-300",
      border: "fuchsia-500",
      circuit: "rgba(255, 0, 255, 0.07)",
    },
    green: {
      primary: "from-emerald-500 to-green-600",
      glow: "emerald-400",
      accent: "emerald-300",
      text: "emerald-300",
      border: "emerald-500",
      circuit: "rgba(0, 255, 128, 0.07)",
    },
    gold: {
      primary: "from-amber-500 to-yellow-600",
      glow: "amber-400",
      accent: "yellow-300",
      text: "yellow-200",
      border: "amber-500",
      circuit: "rgba(255, 215, 0, 0.07)",
    },
  };

  // Random glitch effect
  useEffect(() => {
    if (glitchEffect) {
      const glitchInterval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }, Math.random() * 5000 + 3000);

      return () => clearInterval(glitchInterval);
    }
  }, [glitchEffect]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl backdrop-blur-sm transition-all duration-300",
        "border border-opacity-50 ",
        `border-${colors[variant].border}`,
        pulsate && `animate-pulse-slow`,
        glitchActive && "glitch-effect",
        className
      )}
      style={{
        background: `
          linear-gradient(135deg, rgba(10, 10, 40, 0.8), rgba(5, 5, 20, 0.9))
        `,
        boxShadow: `0 0 20px rgba(var(--${colors[variant].glow}-rgb), 0.3)`,
      }}
      {...props}
    >
      {/* Diagonal gradient header */}
      {title && subtitle && (
        <div
          className={
            colors[variant].primary &&
            `bg-gradient-to-r ${colors[variant].primary} p-4 relative overflow-hidden`
          }
        >
          {/* Circuit pattern overlay */}
          {circuitPattern && (
            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10H10zM30 10h10v10H30zM50 10h10v10H50zM70 10h10v10H70zM90 10h10v10H90zM10 30h10v10H10zM30 30h10v10H30zM50 30h10v10H50zM70 30h10v10H70zM90 30h10v10H90zM10 50h10v10H10zM30 50h10v10H30zM50 50h10v10H50zM70 50h10v10H70zM90 50h10v10H90zM10 70h10v10H10zM30 70h10v10H30zM50 70h10v10H50zM70 70h10v10H70zM90 70h10v10H90zM10 90h10v10H10zM30 90h10v10H30zM50 90h10v10H50zM70 90h10v10H70zM90 90h10v10H90z' fill='${colors[variant].circuit}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: "30px 30px",
              }}
            />
          )}

          {/* Corner accent */}
          {cornerAccent && (
            <>
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div
                  className={`absolute transform rotate-45 bg-${colors[variant].accent} w-24 h-2 top-4 right-[-10px]`}
                ></div>
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden">
                <div
                  className={`absolute transform rotate-45 bg-${colors[variant].accent} w-24 h-2 bottom-4 left-[-10px]`}
                ></div>
              </div>
            </>
          )}

          {/* Title with cyber effect */}
          {title && (
            <h3
              className={`text-xl font-bold text-white relative z-10 flex items-center ${
                glitchActive ? "animate-glitch" : ""
              }`}
              style={{
                textShadow: `0 0 8px rgba(var(--${colors[variant].glow}-rgb), 0.8)`,
              }}
            >
              {title}
              <span
                className={`ml-2 w-2 h-2 rounded-full bg-${
                  colors[variant].accent
                } ${pulsate ? "animate-ping" : ""}`}
              ></span>
            </h3>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className={`text-${colors[variant].text} text-opacity-90 text-sm mt-1 relative z-10`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="p-2 my-auto">
        {/* Circuit pattern in the background */}
        {circuitPattern && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${colors[variant].circuit}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "20px 20px",
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Animated border glow effect */}
      <div className="absolute -inset-px rounded-xl pointer-events-none">
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-${colors[variant].border} to-transparent opacity-30 animate-border-flow`}
        ></div>
      </div>
    </div>
  );
};

export default FancyCyberpunkCard;
