import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * PRISM MetricCard — 메가 숫자 + 라벨 + 보조 텍스트 카드.
 *
 * 토스증권 홈의 메가 숫자 패턴.
 * 주요 사용처: /dashboard "분석된 학교", /analysis 메인 합격률, /planner D-day.
 *
 * Server-safe (Card 베이스).
 */
interface MetricCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  size?: "md" | "lg" | "xl";
  children?: React.ReactNode;
}

const TREND_COLOR: Record<NonNullable<MetricCardProps["trend"]>, string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  suffix,
  description,
  trend = "neutral",
  size = "md",
  className,
  children,
  ...props
}: MetricCardProps) {
  return (
    <Card className={cn("p-6 sm:p-8", className)} {...props}>
      <p className="text-caption text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "font-bold tabular text-foreground leading-none",
            size === "md" && "text-mega-sm sm:text-mega",
            size === "lg" && "text-mega-sm sm:text-mega",
            size === "xl" && "text-mega-xl-sm sm:text-mega-xl",
          )}
        >
          {value}
        </p>
        {suffix && (
          <p className="text-h2 font-semibold text-muted-foreground tabular">
            {suffix}
          </p>
        )}
      </div>
      {description && (
        <p className={cn("text-small mt-2", TREND_COLOR[trend])}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
