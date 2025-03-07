import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { chakra } from "@/lib/fonts";
import { Droplets, WavesLadder } from "lucide-react";

export interface CyberPoolPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerContent?: React.ReactNode;
  variant?: "cyan" | "pink" | "green" | "yellow" | "purple";
  fullHeight?: boolean;
}

export const CyberPoolPanel = ({
  title,
  headerContent,
  variant = "cyan",
  fullHeight = false,
  className,
  children,
  ...props
}: CyberPoolPanelProps) => {
  const headerRef = useRef<HTMLDivElement>(null);

  // Map variant to tailwind classes
  const variantMap = {
    cyan: {
      border: "border-cyan-500/30",
      text: "text-cyan-300",
      shadow: "shadow-cyan-900/20",
      divider: "border-cyan-500/20",
      headerGradient: "bg-gradient-to-tr from-blue-950 to-blue-800",
      primary: "#00FFFF",
      wave1: "#4579e2",
      wave2: "#3461c1",
      wave3: "#2d55aa",
      glow: "rgba(0, 255, 255, 0.5)",
    },
    pink: {
      border: "border-pink-500/30",
      text: "text-pink-300",
      shadow: "shadow-pink-900/20",
      divider: "border-pink-500/20",
      headerGradient: "bg-gradient-to-tr from-pink-950 to-pink-800",
      primary: "#FF00FF",
      wave1: "#e245b3",
      wave2: "#c13484",
      wave3: "#aa2d7a",
      glow: "rgba(255, 0, 255, 0.5)",
    },
    green: {
      border: "border-green-500/30",
      text: "text-green-300",
      shadow: "shadow-green-900/20",
      divider: "border-green-500/20",
      headerGradient: "bg-gradient-to-tr from-green-950 to-green-800",
      primary: "#00FF00",
      wave1: "#45e27a",
      wave2: "#34c161",
      wave3: "#2daa55",
      glow: "rgba(0, 255, 0, 0.5)",
    },
    yellow: {
      border: "border-yellow-500/30",
      text: "text-yellow-300",
      shadow: "shadow-yellow-900/20",
      divider: "border-yellow-500/20",
      headerGradient: "bg-gradient-to-tr from-yellow-950 to-amber-800",
      primary: "#FFFF00",
      wave1: "#e2c845",
      wave2: "#c1aa34",
      wave3: "#aa962d",
      glow: "rgba(255, 255, 0, 0.5)",
    },
    purple: {
      border: "border-purple-500/30",
      text: "text-purple-300",
      shadow: "shadow-purple-900/20",
      divider: "border-purple-500/20",
      headerGradient: "bg-gradient-to-tr from-purple-950 to-purple-800",
      primary: "#A020F0",
      wave1: "#8c45e2",
      wave2: "#7234c1",
      wave3: "#602daa",
      glow: "rgba(160, 32, 240, 0.5)",
    },
  };

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
          className={`${chakra.className} relative border-b ${variantMap[variant].divider} pb-3 px-4 pt-4 flex flex-col ${variantMap[variant].headerGradient} overflow-hidden`}
          style={{ minHeight: "65px" }}
        >
          {/* SVG Wave Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
              className="editorial"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 24 150 28"
              preserveAspectRatio="none"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                bottom: "-10px",
                left: 0,
              }}
            >
              <defs>
                <path
                  id="gentle-wave"
                  d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
                />
              </defs>
              <g className="parallax">
                <use
                  xlinkHref="#gentle-wave"
                  x="50"
                  y="0"
                  fill={variantMap[variant].wave1}
                  style={{ opacity: 0.2 }}
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="50"
                  y="3"
                  fill={variantMap[variant].wave2}
                  style={{ opacity: 0.2 }}
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="50"
                  y="6"
                  fill={variantMap[variant].wave3}
                  style={{ opacity: 0.2 }}
                />
              </g>
            </svg>
          </div>

          {/* Header content */}
          <div className="z-10 relative flex gap-2 items-center group cursor-default">
            {title && (
              <>
                <WavesLadder
                  className="h-6 w-6 text-cyan-400 fill-cyan-500 group-hover:animate-[pulse_1.5s_ease-in-out_infinite]"
                  style={{
                    filter: `drop-shadow(0px 0px 6px ${variantMap[variant].glow})`,
                  }}
                />
                <h2
                  className={`text-2xl font-semibold ${variantMap[variant].text}`}
                  style={{
                    textShadow: `0px 0px 10px ${variantMap[variant].glow}`,
                  }}
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

      {/* CSS Animations */}
      <style jsx>{`
        .parallax > use {
          animation: move-forever 20s linear infinite;
        }
        .parallax > use:nth-child(1) {
          animation-delay: -2s;
        }
        .parallax > use:nth-child(2) {
          animation-delay: -2s;
          animation-duration: 10s;
        }
        .parallax > use:nth-child(3) {
          animation-delay: -4s;
          animation-duration: 7s;
        }
        @keyframes move-forever {
          0% {
            transform: translate(-90px, 0%);
          }
          100% {
            transform: translate(85px, 0%);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CyberPoolPanel;
