import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card v3
 * 브리프 §컴포넌트 1: default/inverted/subtle 3 variants.
 * radius 16, padding 24 (모바일 20), shadow-card.
 * "놓여있는" 느낌 — 떠 있는 그림자 금지.
 */
const cardVariants = cva(
  "rounded-ds-card transition-shadow duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ds-bg-surface)] border border-[color:var(--ds-border-subtle)] shadow-ds-card",
        inverted:
          "bg-[color:var(--ds-bg-inverted)] text-white border border-transparent",
        subtle:
          "bg-[color:var(--ds-bg-subtle)] border border-transparent",
        outline:
          "bg-transparent border border-[color:var(--ds-border-subtle)]",
      },
      padding: {
        none: "p-0",
        md: "p-5 lg:p-6",
        lg: "p-6 lg:p-8",
      },
      interactive: {
        true: "hover:shadow-ds-elevated hover:-translate-y-0.5 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: { variant: "default", padding: "md", interactive: false },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-ds-heading-md", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-ds-body-sm text-[color:var(--ds-text-tertiary)]", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-4 flex items-center gap-2", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { cardVariants };
