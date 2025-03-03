import React from "react";
import { cn } from "@/lib/utils";

export interface CyberPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerContent?: React.ReactNode;
  variant?: "cyan" | "pink" | "green" | "yellow" | "purple";
  fullHeight?: boolean;
}

export const CyberPanel = ({
  title,
  headerContent,
  variant = "cyan",
  fullHeight = false,
  className,
  children,
  ...props
}: CyberPanelProps) => {
  // Map variant to tailwind classes
  const variantMap = {
    cyan: {
      border: "border-cyan-500/30",
      text: "text-cyan-300",
      shadow: "shadow-cyan-900/20",
      divider: "border-cyan-500/20",
    },
    pink: {
      border: "border-pink-500/30",
      text: "text-pink-300",
      shadow: "shadow-pink-900/20",
      divider: "border-pink-500/20",
    },
    green: {
      border: "border-green-500/30",
      text: "text-green-300",
      shadow: "shadow-green-900/20",
      divider: "border-green-500/20",
    },
    yellow: {
      border: "border-yellow-500/30",
      text: "text-yellow-300",
      shadow: "shadow-yellow-900/20",
      divider: "border-yellow-500/20",
    },
    purple: {
      border: "border-purple-500/30",
      text: "text-purple-300",
      shadow: "shadow-purple-900/20",
      divider: "border-purple-500/20",
    },
  };

  return (
    <div
      className={cn(
        "bg-slate-900/60 backdrop-blur-sm border",
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
          className={`border-b ${variantMap[variant].divider} pb-3 px-4 pt-4 flex justify-between items-center`}
        >
          {title && (
            <h2 className={`text-xl font-semibold ${variantMap[variant].text}`}>
              {title}
            </h2>
          )}
          {headerContent}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
