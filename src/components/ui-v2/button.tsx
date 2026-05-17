"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button v3
 * 브리프 §컴포넌트 6: primary(brand bg, white text) / secondary(border, text-primary)
 * / ghost / destructive. sizes sm/md/lg. radius 12. press scale 0.98 120ms.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none",
    "rounded-ds-input transition-all duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[color:var(--ds-brand-primary)] focus-visible:ring-offset-[color:var(--ds-bg-canvas)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--ds-brand-primary)] text-white hover:bg-[color:var(--ds-brand-primary-hover)]",
        secondary:
          "bg-[color:var(--ds-bg-surface)] text-[color:var(--ds-text-primary)] border border-[color:var(--ds-border-default)] hover:bg-[color:var(--ds-bg-subtle)] hover:border-[color:var(--ds-border-strong)]",
        ghost:
          "bg-transparent text-[color:var(--ds-text-primary)] hover:bg-[color:var(--ds-bg-subtle)]",
        destructive:
          "bg-[color:var(--ds-reach)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-ds-body-sm",
        md: "h-11 px-4 text-ds-body-md",
        lg: "h-12 px-5 text-ds-body-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
