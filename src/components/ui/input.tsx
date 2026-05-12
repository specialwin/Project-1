"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "block w-full bg-paper border border-ink/40 focus:border-ink focus:outline-none px-3 py-2 text-ink placeholder:text-muted/70",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
