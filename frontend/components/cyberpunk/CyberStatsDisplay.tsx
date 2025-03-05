import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  percentage?: number; // For bar visualization (0-100)
  color?: string; // Optional override for individual stat
}

interface CyberStatsDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
  variant?: "cyan" | "magenta" | "green" | "multicolor";
  layout?: "grid" | "flexRow" | "flexColumn";
  columns?: 1 | 2 | 3 | 4;
  animateNumbers?: boolean;
  showBars?: boolean;
  glowIntensity?: "low" | "medium" | "high";
  hexPattern?: boolean;
  bordered?: boolean;
  compact?: boolean;
  refreshInterval?: number; // in ms, for simulating data updates
}

export const CyberStatsDisplay = ({
  title,
  subtitle,
  stats,
  variant = "cyan",
  layout = "grid",
  columns = 2,
  animateNumbers = true,
  showBars = true,
  glowIntensity = "medium",
  hexPattern = true,
  bordered = true,
  compact = false,
  refreshInterval,
  className,
  ...props
}: CyberStatsDisplayProps) => {
  const [displayStats, setDisplayStats] = useState<StatItem[]>(stats);
  const [refresh, setRefresh] = useState<boolean>(false);

  // Color configurations
  const variantColors = {
    cyan: {
      primary: "#00FFFF",
      secondary: "#0088FF",
      gradient: "from-cyan-500 to-blue-600",
      text: "text-cyan-300",
      border: "border-cyan-500/50",
      glow: "shadow-cyan-500/50",
      barBg: "bg-cyan-900/30",
      barFill: "bg-cyan-400",
    },
    magenta: {
      primary: "#FF00FF",
      secondary: "#FF0088",
      gradient: "from-pink-500 to-purple-600",
      text: "text-pink-300",
      border: "border-pink-500/50",
      glow: "shadow-pink-500/50",
      barBg: "bg-pink-900/30",
      barFill: "bg-pink-400",
    },
    green: {
      primary: "#00FF88",
      secondary: "#00CC66",
      gradient: "from-green-500 to-emerald-600",
      text: "text-green-300",
      border: "border-green-500/50",
      glow: "shadow-green-500/50",
      barBg: "bg-green-900/30",
      barFill: "bg-green-400",
    },
    multicolor: {
      primary: "#FFFFFF",
      secondary: "#CCCCFF",
      gradient: "from-purple-500 via-cyan-500 to-pink-500",
      text: "text-white",
      border: "border-indigo-500/50",
      glow: "shadow-indigo-500/50",
      barBg: "bg-gray-700/30",
      barFill: "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400",
    },
  };

  // Multicolor stat generator
  const getStatColor = (index: number) => {
    if (variant !== "multicolor") return variantColors[variant];

    const colors = [
      { primary: "#00FFFF", text: "text-cyan-300", barFill: "bg-cyan-400" },
      { primary: "#FF00FF", text: "text-pink-300", barFill: "bg-pink-400" },
      { primary: "#00FF88", text: "text-green-300", barFill: "bg-green-400" },
      { primary: "#FFCC00", text: "text-amber-300", barFill: "bg-amber-400" },
      { primary: "#FF3366", text: "text-rose-300", barFill: "bg-rose-400" },
      { primary: "#3366FF", text: "text-blue-300", barFill: "bg-blue-400" },
    ];

    return {
      ...variantColors.multicolor,
      ...colors[index % colors.length],
    };
  };

  // Glow intensity configurations
  const glowStyles = {
    low: "0 0 5px",
    medium: "0 0 10px",
    high: "0 0 20px",
  };

  // Layout configurations
  const layoutClasses = {
    grid: `grid grid-cols-1 sm:grid-cols-${columns} gap-4`,
    flexRow: "flex flex-wrap justify-between items-center gap-4",
    flexColumn: "flex flex-col space-y-3",
  };

  // Trend icons
  const trendIcons = {
    up: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m5 15 7-7 7 7" />
      </svg>
    ),
    down: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m19 9-7 7-7-7" />
      </svg>
    ),
    neutral: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 12h14" />
      </svg>
    ),
  };

  // Simulate data refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      // Trigger visual refresh indicator
      setRefresh(true);
      setTimeout(() => setRefresh(false), 300);

      // Update stats with slight variations for animation effect
      if (animateNumbers) {
        setDisplayStats((prev) =>
          prev.map((stat) => {
            if (typeof stat.value === "number") {
              // Add slight random variation (±5%)
              const variation = stat.value * (Math.random() * 0.1 - 0.05);
              return {
                ...stat,
                value: Math.max(0, stat.value + variation).toFixed(2),
                percentage: stat.percentage
                  ? Math.min(
                      100,
                      Math.max(0, stat.percentage + (Math.random() * 10 - 5))
                    )
                  : undefined,
              };
            }
            return stat;
          })
        );
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, animateNumbers]);

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden backdrop-blur-sm",
        bordered && `border ${variantColors[variant].border}`,
        compact ? "p-3" : "p-4",
        refresh && "cyber-stats-refresh",
        className
      )}
      style={{
        backgroundColor: "rgba(5, 10, 25, 0.8)",
        boxShadow: `0 0 20px rgba(0, 0, 0, 0.5), ${glowStyles[glowIntensity]} ${variantColors[variant].primary}40`,
      }}
      {...props}
    >
      {/* Background pattern */}
      {hexPattern && (
        <div
          className="absolute inset-0 opacity-5 z-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L39.9 3.414 42.73 0h-9.415zm-20.29 0l9.415 9.414L26.29 5.414 21.717 0h-9.416zm22.857 0l.83.828-1.415 1.415-9.414-9.414h2.827L43.88 0zm-26.886 0l-1.414 1.414 3.242 3.242 5.657-5.657-2.83-2.828L8.796 0h2.827L17.03 0zM0 9.658v5.657l3.828 3.83-1.414 1.413L0 17.97v5.657l1.414 1.414L0 26.284v5.657l2.828 2.83-1.414 1.413L0 34.313v5.657l3.242 3.242-1.414 1.414L0 42.97v5.656l5.657 5.657L0 59.827v-8.485l5.657 5.657.828-.828L0 49.8v-5.656l1.414 1.414L0 47.04v-5.657l5.657 5.657L0 51.627v-8.485l5.657 5.657.828-.828L0 42.313v-5.657l6.485 6.485-1.414 1.414.828.828 7.07-7.07-7.07-7.07L0 36.972v-5.657l8.485 8.485-1.414 1.414L0 34.344v-5.657l5.657 5.657 8.485-8.485-8.485-8.486-5.657 5.658v-5.657l6.485 6.485L0 17.9v-5.657l5.657 5.657 7.07-7.07L5.658 3.757 0 9.414v-5.657L5.657 9.414l.828-.828L0 2.627V0h5.657L0 5.657l.828.828L5.657 2.05 8.485 0H0v2.627l5.657-5.657 7.07 7.07L9.9 0h8.485l2.828 2.83-1.414 1.413 7.07 7.07 2.83-2.83L26.284 0h5.657l2.83 2.83-1.415 1.413 7.07 7.07 2.83-2.83L39.8 0h5.657l2.83 2.83-1.414 1.413 7.07 7.07 2.827-2.83L54.343 0h5.656l-5.656 5.657L60 11.313v2.827l-3.242-3.242L60 11.97v8.484l-3.242-3.242L60 18.284v2.83l-8.485-8.487-1.415 1.415L60 23.97v2.83l-9.9-9.9-1.414 1.415L60 29.244v2.83L48.687 20.9l-1.414 1.413L60 34.57v2.83L43.9 22.313l-1.414 1.414L60 40.97v2.83L38.684 27.658l-1.414 1.413L60 51.8v2.83L33.372 31.9l-1.414 1.413L60 60h-2.83L30.9 33.828l-1.414 1.414L60 64.97v2.83L25.616 41.9l-1.414 1.413L60 78.042v2.83L20.243 46.97 18.83 48.384 60 89.557v-3.2L15.558 43.9l-1.414 1.413L60 90.956v5.656L10.9 52.243 9.414 53.657 60 104.244v-8.486L5.243 51.4 3.83 52.815 60 108.984v8.485L4.315 63.128l-1.414 1.414 57.7 57.7-2.827 2.83-54.872-54.87-1.414 1.414 54.87 54.87L56.5 127.2l-52.043-52.043-1.414 1.414 54.2 54.2-2.83 2.83-51.37-51.374-1.414 1.414 54.2 54.2-2.83 2.83-51.37-51.37-1.414 1.413 54.2 54.2-2.83 2.83-51.37-51.37-1.414 1.413 57.03 57.03h-8.486l-48.544-48.544-1.414 1.414 48.544 48.543h-5.657l-43.63-43.628-1.414 1.414 43.63 43.627h-5.657l-38.716-38.714-1.414 1.414 38.716 38.713h-5.657l-33.8-33.8-1.414 1.414 33.8 33.8h-5.657l-28.885-28.886-1.414 1.414 28.886 28.886h-5.657l-23.972-23.97-1.414 1.413 23.97 23.97h-5.656l-19.056-19.055-1.414 1.414 19.056 19.056h-5.657l-14.143-14.14-1.415 1.413 14.144 14.14h-5.657l-9.23-9.228-1.414 1.414 9.23 9.23h-5.657L1.414 125.856l-1.414 1.414 4.3 4.3h-4.3v-5.657l4.3-4.3-1.414-1.414-2.886 2.885v-5.657L7.07 110.4l-1.414-1.415-5.657 5.657v-5.657l8.485-8.485-1.414-1.414-7.07 7.07v-5.657l11.313-11.313-1.414-1.414L0 99.8v-5.657l14.142-14.142-1.414-1.414L0 90.97v-5.657l17.07-17.07-1.414-1.415L0 82.14v-5.656l19.9-19.9-1.415-1.413L0 73.485v-5.657l22.727-22.727-1.414-1.414L0 64.828v-5.657l25.557-25.556-1.414-1.414L0 56.2v-5.657l28.385-28.385-1.414-1.414L0 47.57v-5.657l31.213-31.213-1.414-1.414L0 38.9v-5.657l34.042-34.04-1.414-1.415L0 30.272v-5.657l36.87-36.87L35.4-13.58 0 21.814v-5.657l39.7-39.7L38.235-25 0 13.23V7.57l42.527-42.525L41.06-36.4 0 4.658V0h3.828L0 3.828l1.414 1.414 45.98-45.98L44.9-43.88 0 1.9z' fill='${variantColors[variant].primary}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        />
      )}

      {/* Header */}
      {(title || subtitle) && (
        <div
          className="relative z-10 mb-4 pb-3 border-b"
          style={{ borderColor: `${variantColors[variant].primary}40` }}
        >
          {title && (
            <h3
              className={`font-bold text-lg ${variantColors[variant].text} flex items-center`}
              style={{
                textShadow: `0 0 5px ${variantColors[variant].primary}80`,
              }}
            >
              {title}
              <span
                className={`ml-2 w-1.5 h-1.5 rounded-full animate-pulse`}
                style={{ backgroundColor: variantColors[variant].primary }}
              ></span>
            </h3>
          )}

          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}

          {/* Diagonal accent line */}
          <div
            className="absolute top-0 right-0 w-8 h-8 overflow-hidden"
            style={{ transform: "translate(4px, -4px)" }}
          >
            <div
              className="absolute transform rotate-45 w-16 h-1.5"
              style={{
                backgroundColor: variantColors[variant].primary,
                boxShadow: `0 0 10px ${variantColors[variant].primary}80`,
                opacity: 0.7,
                top: "8px",
                left: "-4px",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Stats Content */}
      <div className={`relative z-10 ${layoutClasses[layout]}`}>
        {displayStats.map((stat, index) => {
          const colors =
            variant === "multicolor"
              ? getStatColor(index)
              : variantColors[variant];
          const statColor = stat.color || colors.primary;
          const percentage =
            stat.percentage !== undefined ? stat.percentage : 50;

          return (
            <div
              key={index}
              className={cn(
                "relative",
                stat.highlight ? "animate-pulse-slow" : "",
                layout === "flexRow" ? "flex-1 min-w-[120px]" : ""
              )}
            >
              {/* Label */}
              <div className="text-gray-400 text-xs mb-1 flex items-center">
                {stat.label}
                {stat.trend && (
                  <span
                    className={cn(
                      "ml-1",
                      stat.trend === "up"
                        ? "text-green-400"
                        : stat.trend === "down"
                        ? "text-red-400"
                        : "text-gray-400"
                    )}
                  >
                    {trendIcons[stat.trend]}
                  </span>
                )}
              </div>

              {/* Value */}
              <div
                className={`text-lg font-bold ${colors.text} font-mono`}
                style={{ textShadow: `0 0 5px ${statColor}80` }}
              >
                {stat.prefix && (
                  <span className="text-gray-300 mr-1">{stat.prefix}</span>
                )}
                {stat.value}
                {stat.suffix && (
                  <span className="text-gray-300 ml-1">{stat.suffix}</span>
                )}
              </div>

              {/* Bar visualization */}
              {showBars && (
                <div
                  className={`mt-1 w-full h-1.5 ${colors.barBg} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full ${
                      variant === "multicolor" && stat.color
                        ? ""
                        : colors.barFill
                    } transition-all duration-500 ease-out rounded-full`}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: stat.color,
                      boxShadow: `0 0 5px ${statColor}80`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom circuit line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 z-10 overflow-hidden">
        <div
          className="absolute inset-0 animate-circuit"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${variantColors[variant].primary} 50%, transparent 100%)`,
            backgroundSize: "200% 100%",
          }}
        ></div>
      </div>
    </div>
  );
};

export default CyberStatsDisplay;
