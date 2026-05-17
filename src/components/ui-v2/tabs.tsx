"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/** Tabs v3 — Radix wrapper. underline + active brand. */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 border-b border-[color:var(--ds-border-subtle)]",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center px-3 py-2 text-ds-body-md font-medium",
      "text-[color:var(--ds-text-tertiary)] transition-colors duration-[120ms]",
      "hover:text-[color:var(--ds-text-primary)] disabled:pointer-events-none disabled:opacity-50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)] focus-visible:ring-offset-2 rounded-sm",
      "data-[state=active]:text-[color:var(--ds-text-primary)]",
      "after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-transparent",
      "data-[state=active]:after:bg-[color:var(--ds-brand-primary)]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
