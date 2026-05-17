"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/** Tooltip v3 — Radix wrapper. dark surface, body-sm. */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-ds-input bg-[color:var(--ds-bg-inverted)] px-3 py-1.5",
      "text-ds-body-sm text-white shadow-ds-elevated",
      "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
      "data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0",
      "data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
