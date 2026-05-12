"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "block w-full bg-paper border border-ink/40 focus:border-ink focus:outline-none px-3 py-2 text-ink placeholder:text-muted/70 leading-relaxed",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
