import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

type ButtonVariant = "cyan" | "magenta" | "green" | "rainbow";

interface CyberWalletButtonProps {
  variant?: ButtonVariant;
  className?: string;
  networkButton?: boolean;
  scanlineEffect?: boolean;
  glitchOnHover?: boolean;
  pulseEffect?: boolean;
  cornerAccents?: boolean;
  showBalanceInButton?: boolean;
}

export const CyberWalletButton = ({
  variant = "cyan",
  className,
  networkButton = false,
  scanlineEffect = true,
  glitchOnHover = true,
  pulseEffect = true,
  cornerAccents = true,
  showBalanceInButton = true,
}: CyberWalletButtonProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Trigger random glitch effect when hovering
  useEffect(() => {
    if (isHovering && glitchOnHover) {
      const glitchInterval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }, Math.random() * 2000 + 1000);

      return () => clearInterval(glitchInterval);
    }
  }, [isHovering, glitchOnHover]);

  // Color configurations based on variant
  const variantColors = {
    cyan: {
      primary: "#00FFFF",
      bg: "bg-slate-900/90",
      border: "border-cyan-500/50",
      text: "text-cyan-300",
      hover: "group-hover:border-cyan-400/70",
      glow: "shadow-cyan-600/30",
      activeGlow: "group-hover:shadow-cyan-400/40",
      highlight: "bg-cyan-500/10",
      gradientFrom: "from-cyan-500/20",
      gradientTo: "to-blue-600/20",
    },
    magenta: {
      primary: "#FF00FF",
      bg: "bg-slate-900/90",
      border: "border-pink-500/50",
      text: "text-pink-300",
      hover: "group-hover:border-pink-400/70",
      glow: "shadow-pink-600/50",
      activeGlow: "group-hover:shadow-pink-400/40",
      highlight: "bg-pink-500/10",
      gradientFrom: "from-pink-500/40",
      gradientTo: "to-purple-600/60",
    },
    green: {
      primary: "#00FF88",
      bg: "bg-slate-900/90",
      border: "border-green-500/50",
      text: "text-green-300",
      hover: "group-hover:border-green-400/70",
      glow: "shadow-green-600/30",
      activeGlow: "group-hover:shadow-green-400/40",
      highlight: "bg-green-500/10",
      gradientFrom: "from-green-500/20",
      gradientTo: "to-emerald-600/20",
    },
    rainbow: {
      primary: "#FFFFFF",
      bg: "bg-slate-900/90",
      border: "border-indigo-500/50",
      text: "text-white",
      hover: "group-hover:border-indigo-400/70",
      glow: "shadow-indigo-600/30",
      activeGlow: "group-hover:shadow-indigo-400/40",
      highlight: "bg-indigo-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-pink-500/20",
    },
  };

  const colors = variantColors[variant];

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            className={cn("relative", className)}
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {(() => {
              if (!connected) {
                // Not connected state
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={cn(
                      "group relative flex items-center justify-center",
                      "px-4 py-2 min-w-[160px] h-10",
                      "rounded-md backdrop-blur-sm transition-all duration-300",
                      "border shadow-md",
                      colors.bg,
                      colors.border,
                      colors.glow,
                      "hover:shadow-lg active:scale-95",
                      colors.activeGlow,
                      glitchActive && "animate-glitch"
                    )}
                  >
                    {/* Subtle gradient background */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-md opacity-40 z-0 transition-opacity duration-300",
                        "bg-gradient-to-r",
                        colors.gradientFrom,
                        colors.gradientTo,
                        "group-hover:opacity-60"
                      )}
                    />

                    {/* Corner accents if enabled */}
                    {cornerAccents && (
                      <>
                        <span
                          className={cn(
                            "absolute top-0 left-0 w-2 h-2 border-t border-l transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute top-0 right-0 w-2 h-2 border-t border-r transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                      </>
                    )}

                    {/* Scanlines effect */}
                    {scanlineEffect && (
                      <div className="absolute inset-0 opacity-10 z-0 pointer-events-none overflow-hidden rounded-md">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `repeating-linear-gradient(
                              0deg,
                              ${colors.primary}10,
                              ${colors.primary}10 1px,
                              transparent 1px,
                              transparent 2px
                            )`,
                            backgroundSize: "100% 2px",
                          }}
                        />
                      </div>
                    )}

                    {/* Button icon */}
                    <div className="mr-2 relative">
                      <Wallet className={colors.text} />
                      {/* <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={colors.text}
                      >
                        <path d="M18.2 7.8c.4.5.6 1.1.6 1.7 0 1.7-1.4 3-3 3H9.5L6 16.2V9.8c0-1.7 1.3-3 3-3h9.2c.2 0 .3 0 .5-.1L15 4V6h2v-.2c.4.1.8.4 1.2.8l1.2 1.2Z" />
                        <path d="M19.3 14.8c-.3.9-1 1.6-1.9 2-1 .4-2 .6-3.1.5h-5l-3 3v-3h-1.5c-1.7 0-3.1-1.3-3.1-3V7.5" />
                      </svg> */}
                      {pulseEffect && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                            "animate-ping opacity-75"
                          )}
                          style={{ backgroundColor: colors.primary }}
                        />
                      )}
                    </div>

                    {/* Button text */}
                    <span
                      className={cn("font-medium relative z-10", colors.text)}
                    >
                      Connect
                    </span>
                  </button>
                );
              }

              if (chain.unsupported) {
                // Wrong network state
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      "group relative flex items-center justify-center",
                      "px-4 py-2 min-w-[160px] h-10",
                      "rounded-md backdrop-blur-sm transition-all duration-300",
                      "border shadow-md",
                      "bg-red-900/80",
                      "border-red-500/60",
                      "shadow-red-600/30",
                      "hover:shadow-lg active:scale-95",
                      "hover:shadow-red-500/40",
                      glitchActive && "animate-glitch"
                    )}
                  >
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 rounded-md opacity-40 z-0 transition-opacity duration-300 bg-gradient-to-r from-red-600/20 to-orange-600/20 group-hover:opacity-60" />

                    {/* Button icon */}
                    <div className="mr-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-300"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>

                    {/* Button text */}
                    <span className="font-medium relative z-10 text-red-300">
                      Wrong Network
                    </span>
                  </button>
                );
              }

              // Connected state
              return (
                <div className="flex items-center gap-2">
                  {/* Network button */}
                  {networkButton && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className={cn(
                        "group relative flex items-center justify-center",
                        "px-3 py-2 h-10",
                        "rounded-md backdrop-blur-sm transition-all duration-300",
                        "border shadow-md",
                        colors.bg,
                        colors.border,
                        colors.glow,
                        "hover:shadow-lg active:scale-95",
                        colors.activeGlow
                      )}
                    >
                      {/* Background gradient */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-md opacity-40 z-0 transition-opacity duration-100",
                          "bg-gradient-to-r",
                          colors.gradientFrom,
                          colors.gradientTo,
                          "group-hover:opacity-60"
                        )}
                      />

                      {/* Chain icon and name */}
                      <div className="flex items-center relative z-10 ">
                        {chain.hasIcon && (
                          <div
                            className={cn(
                              "w-5 h-5 flex items-center justify-center rounded-full overflow-hidden mr-2",
                              "border",
                              colors.border
                            )}
                            style={{ background: chain.iconBackground }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                className="w-4 h-4 object-contain"
                              />
                            )}
                          </div>
                        )}
                        <span
                          className={cn("text-sm font-medium", colors.text)}
                        >
                          {chain.name || "Unknown"}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Account button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={cn(
                      "group relative flex items-center justify-between",
                      "px-4 py-2 h-10 min-w-[140px]",
                      "rounded-md backdrop-blur-sm transition-all duration-100",
                      "border shadow-md",
                      colors.bg,
                      colors.border,
                      colors.glow,
                      "hover:shadow-lg active:scale-95",
                      colors.activeGlow,
                      glitchActive && "animate-glitch"
                    )}
                  >
                    {/* Subtle gradient background */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-md opacity-40 z-0 transition-opacity duration-300",
                        "bg-gradient-to-r",
                        colors.gradientFrom,
                        colors.gradientTo,
                        "group-hover:opacity-60"
                      )}
                    />

                    <div className="flex items-center relative z-10 ">
                      {chain.hasIcon && (
                        <div
                          className={cn(
                            "w-5 h-5 flex items-center justify-center rounded-full overflow-hidden mr-2",
                            "border",
                            colors.border
                          )}
                          style={{ background: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                        </div>
                      )}
                      <span className={cn("text-sm font-medium", colors.text)}>
                        {chain.name || "Unknown"}
                      </span>
                      <span className={cn("m-2", colors.text)}>{"|"}</span>
                    </div>

                    {/* Corner accents if enabled */}
                    {cornerAccents && (
                      <>
                        <span
                          className={cn(
                            "absolute top-0 left-0 w-2 h-2 border-t border-l transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute top-0 right-0 w-2 h-2 border-t border-r transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-all duration-300",
                            colors.border,
                            colors.hover
                          )}
                        />
                      </>
                    )}

                    {/* Scanlines effect */}
                    {scanlineEffect && (
                      <div className="absolute inset-0 opacity-10 z-0 pointer-events-none overflow-hidden rounded-md">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `repeating-linear-gradient(
                              0deg,
                              ${colors.primary}10,
                              ${colors.primary}10 1px,
                              transparent 1px,
                              transparent 2px
                            )`,
                            backgroundSize: "100% 2px",
                          }}
                        />
                      </div>
                    )}

                    {/* Account info container */}
                    <div className="flex items-center relative z-10">
                      {/* Account display name and balance */}
                      <div className="flex flex-row gap-2 items-center">
                        <span
                          className={cn("text-sm font-medium", colors.text)}
                        >
                          {account.ensName || account.displayName}
                        </span>
                        {showBalanceInButton && account.displayBalance && (
                          <span className="text-xs text-gray-400">
                            {account.displayBalance}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transaction status indicator */}
                    {account.hasPendingTransactions && (
                      <div className="relative z-10 ml-2 w-2 h-2">
                        <span
                          className={cn(
                            "absolute w-2 h-2 rounded-full",
                            "animate-ping opacity-75"
                          )}
                          style={{ backgroundColor: colors.primary }}
                        />
                        <span
                          className={cn("absolute w-2 h-2 rounded-full")}
                          style={{ backgroundColor: colors.primary }}
                        />
                      </div>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CyberWalletButton;
