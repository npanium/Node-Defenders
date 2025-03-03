import React, { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonButtonVariants = cva(
  "rounded-lg font-medium transition-all duration-300 ease-in-out flex items-center justify-center",
  {
    variants: {
      variant: {
        cyan: "bg-cyan-600/80 hover:bg-cyan-500/90 text-white border border-cyan-500/50 shadow-lg shadow-cyan-600/30",
        pink: "bg-pink-600/80 hover:bg-pink-500/90 text-white border border-pink-500/50 shadow-lg shadow-pink-600/30",
        green:
          "bg-green-600/80 hover:bg-green-500/90 text-white border border-green-500/50 shadow-lg shadow-green-600/30",
        purple:
          "bg-purple-600/80 hover:bg-purple-500/90 text-white border border-purple-500/50 shadow-lg shadow-purple-600/30",
        amber:
          "bg-amber-600/80 hover:bg-amber-500/90 text-white border border-amber-500/50 shadow-lg shadow-amber-600/30",
        outline:
          "bg-transparent border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30",
        ghost:
          "bg-transparent border-none shadow-none hover:bg-slate-800/50 text-cyan-400",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
        xl: "h-16 px-8 text-xl",
      },
      glow: {
        true: "hover:shadow-xl active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "cyan",
      size: "md",
      glow: true,
    },
  }
);

export interface NeonButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof neonButtonVariants>, "color"> {}

export const NeonButton = ({
  className,
  variant,
  size,
  glow,
  children,
  ...props
}: NeonButtonProps) => {
  return (
    <button
      className={cn(neonButtonVariants({ variant, size, glow }), className)}
      {...props}
    >
      {children}
    </button>
  );
};
