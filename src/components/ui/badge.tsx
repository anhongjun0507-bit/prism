import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * PRISM Badge — 합격 카테고리(safety/match/reach) · semantic · AI 칩.
 * 모두 pill(rounded-full). caption 사이즈는 uppercase + tracking이 fontSize 정의에 포함됨.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-transparent text-foreground",
        primary: "bg-primary text-primary-foreground",
        safety: "bg-admission-safety-soft text-admission-safety",
        match: "bg-admission-match-soft text-admission-match",
        reach: "bg-admission-reach-soft text-admission-reach",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-destructive",
        info: "bg-info-soft text-info",
        ai: "bg-prism-soft text-prism border border-primary/20",
      },
      size: {
        sm: "h-5 px-2 text-caption",
        md: "h-6 px-2.5 text-small",
        lg: "h-7 px-3 text-small",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
