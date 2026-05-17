import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge v3 — 라벨/배지. radius 12.
 * 카테고리 4종(reach/hard/target/safety)은 별도 <CategoryPill>이 담당 (Phase 2).
 * 여기서는 일반 의미 배지(neutral/brand/accent/success/warning/danger/info).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-ds-input px-2.5 py-0.5 text-ds-body-sm font-medium [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral:
          "bg-[color:var(--ds-bg-subtle)] text-[color:var(--ds-text-secondary)]",
        brand:
          "bg-[color:var(--ds-brand-primary-soft)] text-[color:var(--ds-brand-primary)]",
        accent:
          "bg-[color:var(--ds-brand-accent-soft)] text-[#8A5A0E]",
        success:
          "bg-[color:var(--ds-safety-soft)] text-[color:var(--ds-safety)]",
        warning:
          "bg-[color:var(--ds-hard-soft)] text-[color:var(--ds-hard)]",
        danger:
          "bg-[color:var(--ds-reach-soft)] text-[color:var(--ds-reach)]",
        outline:
          "bg-transparent border border-[color:var(--ds-border-default)] text-[color:var(--ds-text-secondary)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
