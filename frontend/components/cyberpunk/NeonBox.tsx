import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonBoxVariants = cva(
  "rounded-lg backdrop-blur-sm transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        cyan: "border border-cyan-500/50 bg-slate-900/60 shadow-neon-blue",
        pink: "border border-pink-500/50 bg-slate-900/60 shadow-neon-purple",
        green: "border border-green-500/50 bg-slate-900/60 shadow-neon-green",
        yellow:
          "border border-yellow-500/50 bg-slate-900/60 shadow-neon-yellow",
        purple:
          "border border-purple-500/50 bg-slate-900/60 shadow-neon-purple",
      },
      glow: {
        true: "hover:shadow-lg hover:shadow-cyan-500/50 hover:border-cyan-400",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "cyan",
      glow: true,
      padding: "md",
    },
  }
);

export interface NeonBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof neonBoxVariants>, "color"> {
  variant?: "cyan" | "pink" | "green" | "yellow" | "purple";
}

export const NeonBox = ({
  className,
  variant,
  glow,
  padding,
  children,
  ...props
}: NeonBoxProps) => {
  return (
    <div
      className={cn(neonBoxVariants({ variant, glow, padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
};
