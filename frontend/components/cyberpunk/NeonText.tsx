import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonTextVariants = cva(
  "font-bold transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        cyan: "text-cyan-400 text-shadow-glow shadow-cyan-500",
        pink: "text-pink-400 text-shadow-glow shadow-pink-500",
        green: "text-green-400 text-shadow-glow shadow-green-500",
        yellow: "text-yellow-400 text-shadow-glow shadow-yellow-500",
        purple: "text-purple-400 text-shadow-glow shadow-purple-500",
      },
      size: {
        sm: "text-sm",
        md: "text-lg",
        lg: "text-2xl",
        xl: "text-4xl",
      },
      flicker: {
        true: "animate-text-flicker",
        false: "",
      },
    },
    defaultVariants: {
      variant: "cyan",
      size: "md",
      flicker: false,
    },
  }
);

export interface NeonTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof neonTextVariants>, "color"> {
  variant?: "cyan" | "pink" | "green" | "yellow" | "purple";
}

export const NeonText = ({
  className,
  variant,
  size,
  flicker,
  children,
  ...props
}: NeonTextProps) => {
  return (
    <span
      className={cn(neonTextVariants({ variant, size, flicker }), className)}
      {...props}
    >
      {children}
    </span>
  );
};
