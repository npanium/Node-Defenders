import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface NeonButtonOption {
  id: string;
  icon?: React.ReactNode;
  label: string;
}

// The issue is with the onChange property conflicting with HTMLAttributes
// Use a separate interface to define the component's props
interface NeonButtonBaseProps {
  options: NeonButtonOption[];
  activeId?: string;
  onSelectionChange?: (id: string) => void; // Renamed from onChange to avoid conflict
  variant?: "cyan" | "magenta" | "green" | "yellow" | "rainbow";
  size?: "sm" | "md" | "lg";
  hover3DEffect?: boolean;
  illuminateActive?: boolean;
  glitchOnChange?: boolean;
  fullWidth?: boolean;
}

// Extend this with HTMLAttributes but omit any conflicting properties
type AnimatedNeonButtonGroupProps = NeonButtonBaseProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">;

export const AnimatedNeonButtonGroup = ({
  options,
  activeId,
  onSelectionChange, // Use the renamed prop
  variant = "cyan",
  size = "md",
  hover3DEffect = true,
  illuminateActive = true,
  glitchOnChange = true,
  fullWidth = false,
  className,
  ...props
}: AnimatedNeonButtonGroupProps) => {
  const [active, setActive] = useState(activeId || options[0]?.id);
  const [glitching, setGlitching] = useState<string | null>(null);

  // Get the colors based on variant
  const getColors = (buttonVariant: string) => {
    const colorMap = {
      cyan: {
        bg: "bg-black/30",
        text: "text-cyan-300",
        border: "border-cyan-500",
        glow: "shadow-cyan-500/50",
        activeBg: "bg-cyan-900/20",
        gradient: "from-cyan-500 to-blue-600",
      },
      magenta: {
        bg: "bg-black/30",
        text: "text-pink-300",
        border: "border-pink-500",
        glow: "shadow-pink-500/50",
        activeBg: "bg-pink-900/20",
        gradient: "from-pink-500 to-purple-600",
      },
      green: {
        bg: "bg-black/30",
        text: "text-green-300",
        border: "border-green-500",
        glow: "shadow-green-500/50",
        activeBg: "bg-green-900/20",
        gradient: "from-green-500 to-emerald-600",
      },
      yellow: {
        bg: "bg-black/30",
        text: "text-yellow-300",
        border: "border-yellow-500",
        glow: "shadow-yellow-500/50",
        activeBg: "bg-yellow-900/20",
        gradient: "from-yellow-500 to-amber-600",
      },
      rainbow: {
        bg: "bg-black/30",
        text: "text-white",
        border: "border-white",
        glow: "shadow-purple-500/50",
        activeBg: "bg-purple-900/20",
        gradient: "from-red-500 via-purple-500 to-blue-500",
      },
    };

    return colorMap[buttonVariant as keyof typeof colorMap] || colorMap.cyan;
  };

  // Get size based on prop
  const getSizeClasses = () => {
    const sizeMap = {
      sm: "text-xs py-1 px-3",
      md: "text-sm py-2 px-4",
      lg: "text-base py-3 px-6",
    };

    return sizeMap[size as keyof typeof sizeMap];
  };

  // Handle button click
  const handleButtonClick = (id: string) => {
    if (id === active) return;

    if (glitchOnChange) {
      setGlitching(id);
      setTimeout(() => setGlitching(null), 300);
    }

    setActive(id);
    onSelectionChange && onSelectionChange(id); // Use the renamed prop
  };

  // Get colors for the current variant
  const colors = getColors(variant);
  const sizeClasses = getSizeClasses();

  // Rainbow gradient animation
  const rainbowAnimation =
    variant === "rainbow" ? "animate-gradient-x bg-[length:400%_100%]" : "";

  return (
    <div
      className={cn(
        "flex items-center backdrop-blur-sm rounded-lg p-1 bg-black/20",
        fullWidth ? "w-full" : "inline-flex",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, rgba(50, 50, 75, 0.1), transparent 100%)",
      }}
      {...props}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleButtonClick(option.id)}
          className={cn(
            "relative group flex items-center justify-center space-x-2 rounded-lg transition-all duration-100 font-medium",
            sizeClasses,
            option.id === active
              ? `${colors.activeBg} border ${colors.text} ${colors.border}`
              : `${colors.bg} text-white/70 border-transparent`,
            hover3DEffect && "transform hover:translate-y-0.5",
            illuminateActive &&
              option.id === active &&
              `shadow-lg hover:shadow-sm ${colors.glow}`,
            option.id === glitching && "animate-glitch",
            fullWidth ? "flex-1" : "",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 focus:ring-offset-black"
          )}
          style={{
            borderWidth: "1px",
            textShadow:
              option.id === active
                ? `0 0 8px ${
                    variant === "rainbow" ? "rgba(255, 255, 255, 0.7)" : ""
                  }`
                : "none",
          }}
        >
          {/* Background gradient for active button */}
          {option.id === active && (
            <div
              className={`absolute inset-0 rounded opacity-30 bg-gradient-to-r ${colors.gradient} ${rainbowAnimation} -z-10`}
              style={{
                filter: "blur(1px)",
              }}
            ></div>
          )}

          {/* Button content with icon and label */}
          {option.icon && (
            <span
              className={`${
                option.id === active ? colors.text : "text-white/70"
              }`}
            >
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>

          {/* Hover effect */}
          <span className="absolute inset-0 rounded overflow-hidden opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
            <span className="absolute inset-0 scale-[2.5] blur-md bg-gradient-to-b from-white/5 to-transparent transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default AnimatedNeonButtonGroup;
