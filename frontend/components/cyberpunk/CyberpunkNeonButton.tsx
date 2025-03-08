import React, { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CyberpunkNeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "magenta" | "green" | "yellow" | "rainbow";
  size?: "sm" | "md" | "lg";
  hover3DEffect?: boolean;
  illuminate?: boolean;
  glitchOnClick?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isActive?: boolean;
  noBorder?: boolean;
  pulseEffect?: boolean;
}

export const CyberpunkNeonButton = forwardRef<
  HTMLButtonElement,
  CyberpunkNeonButtonProps
>(
  (
    {
      variant = "cyan",
      size = "md",
      hover3DEffect = true,
      illuminate = true,
      glitchOnClick = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      isActive = false,
      noBorder = false,
      pulseEffect = false,
      className,
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isGlitching, setIsGlitching] = useState(false);

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

    // Handle button click with optional glitch effect
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (glitchOnClick) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
      }

      onClick?.(e);
    };

    // Get colors for the current variant
    const colors = getColors(variant);
    const sizeClasses = getSizeClasses();

    // Rainbow gradient animation
    const rainbowAnimation =
      variant === "rainbow" ? "animate-gradient-x bg-[length:400%_100%]" : "";

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative group inline-flex items-center justify-center rounded-lg transition-all duration-150 font-medium",
          sizeClasses,
          isActive || illuminate
            ? `${colors.activeBg} ${!noBorder ? colors.border : ""} ${
                colors.text
              }`
            : `${colors.bg} text-white/70 ${
                !noBorder ? "border-transparent" : ""
              }`,
          hover3DEffect &&
            !disabled &&
            "transform hover:translate-y-0.5 hover:bg-slate-700/40",
          illuminate && !disabled && `shadow-lg hover:shadow-sm ${colors.glow}`,
          isGlitching && "animate-glitch",
          pulseEffect && "animate-pulse-slow",
          fullWidth ? "w-full" : "",
          disabled && "opacity-50 cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50 focus:ring-offset-black",
          className
        )}
        style={{
          borderWidth: noBorder ? 0 : 1,
          textShadow:
            isActive || illuminate
              ? `0 0 8px ${
                  variant === "rainbow" ? "rgba(255, 255, 255, 0.7)" : ""
                }`
              : "none",
        }}
        {...props}
      >
        {/* Background gradient */}
        <div
          className={cn(
            "absolute inset-0 rounded opacity-30 bg-gradient-to-r -z-10",
            colors.gradient,
            rainbowAnimation,
            disabled && "opacity-10"
          )}
          style={{
            filter: "blur(1px)",
          }}
        ></div>

        {/* Scanline effect */}
        <div className="absolute inset-0 opacity-10 z-0 pointer-events-none overflow-hidden rounded">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.1),
                rgba(255, 255, 255, 0.1) 1px,
                transparent 1px,
                transparent 2px
              )`,
              backgroundSize: "100% 2px",
            }}
          />
        </div>

        {/* Content container */}
        <div className="flex items-center justify-center gap-2 z-10">
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </div>

        {/* Hover effect */}
        {!disabled && (
          <span className="absolute inset-0 rounded overflow-hidden opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
            <span className="absolute inset-0 scale-[2.5] blur-md bg-gradient-to-b from-white/5 to-transparent transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
          </span>
        )}
      </button>
    );
  }
);

CyberpunkNeonButton.displayName = "CyberpunkNeonButton";

export default CyberpunkNeonButton;
