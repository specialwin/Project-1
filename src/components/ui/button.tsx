"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-serif text-base tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-paper hover:bg-rule px-5 py-3 border border-ink",
        outline:
          "border border-ink text-ink bg-transparent hover:bg-ink/5 px-5 py-3",
        ghost: "text-ink hover:bg-ink/5 px-3 py-2",
        quiet:
          "text-muted hover:text-ink px-2 py-1 text-sm uppercase tracking-wider2",
      },
      size: {
        default: "",
        lg: "px-7 py-4 text-lg",
        sm: "px-3 py-2 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
