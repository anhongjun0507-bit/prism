import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Card variant scale — v2 redesign (잉크 1색·hairline·그라데이션 없음).
 *   default  — hairline border + bg-surface (표준)
 *   plain    — 테두리 없는 단순 surface
 *   elevated — hairline shadow (강조)
 *   hero     — bg-inverse(잉크) hero — 대시보드/구독 검정 카드
 *   glass    — bg-surface + hairline border (legacy alias, 단순화)
 *   accent   — accent-ink-soft 배경 + 잉크 hairline (추천/CTA 카드)
 *
 * interactive=true → border-strong hover (그림자 폐기)
 */
const cardVariants = cva(
  "text-card-foreground transition-[border-color,background-color] duration-micro ease-brand",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-border-subtle bg-card",
        plain: "rounded-lg bg-card",
        elevated: "rounded-lg bg-card border border-border-subtle shadow-hairline",
        hero: "rounded-lg bg-inverse border-none overflow-hidden relative isolate",
        glass: "rounded-lg bg-card border border-border-subtle",
        accent: "rounded-lg bg-accent border border-border-subtle",
      },
      interactive: {
        true: "cursor-pointer hover:border-border-strong active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-display font-semibold leading-none tracking-tightest",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
