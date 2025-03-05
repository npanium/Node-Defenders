import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

type ButtonVariant = "cyan" | "magenta" | "green" | "rainbow";

interface CyberpunkConnectButtonProps {
  variant?: ButtonVariant;
  className?: string;
}

export const CyberpunkConnectButton = ({
  variant = "cyan",
  className,
}: CyberpunkConnectButtonProps) => {
  // Color configurations based on variant
  const variantColors = {
    cyan: {
      primary: "#00FFFF",
      secondary: "#0088FF",
      bg: "bg-cyan-600/80",
      bgHover: "hover:bg-cyan-500/90",
      border: "border-cyan-500/50",
      text: "text-cyan-300",
      glow: "shadow-cyan-600/30",
      gradient: "from-cyan-500 to-blue-600",
    },
    magenta: {
      primary: "#FF00FF",
      secondary: "#FF0088",
      bg: "bg-pink-600/80",
      bgHover: "hover:bg-pink-500/90",
      border: "border-pink-500/50",
      text: "text-pink-300",
      glow: "shadow-pink-600/30",
      gradient: "from-pink-500 to-purple-600",
    },
    green: {
      primary: "#00FF88",
      secondary: "#00CC66",
      bg: "bg-green-600/80",
      bgHover: "hover:bg-green-500/90",
      border: "border-green-500/50",
      text: "text-green-300",
      glow: "shadow-green-600/30",
      gradient: "from-green-500 to-emerald-600",
    },
    rainbow: {
      primary: "#FFFFFF",
      secondary: "#CCCCFF",
      bg: "bg-slate-800/80",
      bgHover: "hover:bg-slate-700/90",
      border: "border-indigo-500/50",
      text: "text-white",
      glow: "shadow-indigo-600/30",
      gradient: "from-purple-500 via-cyan-500 to-pink-500",
    },
  };

  const colors = variantColors[variant];

  // Base button styles
  const buttonBaseStyles = cn(
    "relative rounded-lg font-medium transition-all duration-300 border shadow-lg",
    "flex items-center justify-center",
    colors.bg,
    colors.bgHover,
    colors.border,
    "shadow-lg",
    colors.glow,
    "py-2 px-4",
    "active:scale-95"
  );

  // Account button styles
  const accountButtonStyles = cn(buttonBaseStyles, "gap-2", "min-w-[140px]");

  // Error/wrong network button styles
  const errorButtonStyles = cn(
    buttonBaseStyles,
    "bg-red-600/80",
    "hover:bg-red-500/90",
    "border-red-500/50",
    "shadow-red-600/30"
  );

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
            className={cn("flex items-center gap-3", className)}
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={buttonBaseStyles}
                  >
                    <span className="relative z-10">Connect Wallet</span>

                    {/* Subtle gradient background */}
                    <div
                      className={`absolute inset-0 rounded-lg opacity-50 bg-gradient-to-r ${colors.gradient} -z-10`}
                    ></div>

                    {/* Animated corner brackets */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br"></div>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={errorButtonStyles}
                  >
                    <span className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mr-2"
                      >
                        <path
                          d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM7 3v6h2V3H7zm0 8v2h2v-2H7z"
                          fill="currentColor"
                        />
                      </svg>
                      Wrong Network
                    </span>
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  {/* Network/Chain button */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(buttonBaseStyles, "pl-3 pr-4 py-2 h-10")}
                  >
                    <div className="flex items-center">
                      {chain.hasIcon && (
                        <div
                          className="w-5 h-5 mr-2 rounded-full overflow-hidden border"
                          style={{
                            borderColor: colors.primary,
                            background: chain.iconBackground,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium">{chain.name}</span>
                    </div>
                  </button>

                  {/* Account button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={accountButtonStyles}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {/* Account avatar/icon */}
                        <div
                          className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center mr-2 border ${colors.border}`}
                        >
                          <span className="text-xs">
                            {account.displayName.slice(0, 2)}
                          </span>
                        </div>

                        {/* Account info */}
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">
                            {account.displayName}
                          </span>
                          {account.displayBalance && (
                            <span className={`text-xs ${colors.text}`}>
                              {account.displayBalance}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status indicator - pulsing when has pending transactions */}
                      {account.hasPendingTransactions && (
                        <div className="ml-2 relative">
                          <div
                            className="w-2 h-2 rounded-full animate-pulse absolute"
                            style={{
                              backgroundColor: colors.primary,
                              boxShadow: `0 0 5px ${colors.primary}`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Subtle gradient background */}
                    <div
                      className={`absolute inset-0 rounded-lg opacity-30 bg-gradient-to-r ${colors.gradient} -z-10`}
                    ></div>
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

export default CyberpunkConnectButton;
