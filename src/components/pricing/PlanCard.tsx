"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BillingCycle, PlanDef } from "@/lib/plans";

export interface PlanCta {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
  href?: string;
}

interface PlanCardProps {
  plan: PlanDef;
  billing: BillingCycle;
  recommended?: boolean;
  cta: PlanCta;
}

/** 플랜 카드 (가이드 §15): Pro=추천+ring, Elite=accent 보더, highlights 리스트 + CTA. */
export function PlanCard({ plan, billing, recommended, cta }: PlanCardProps) {
  const isElite = plan.id === "elite";
  const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const period = price === 0 ? "" : billing === "yearly" ? "/년" : "/월";
  const monthlyEquiv =
    billing === "yearly" && plan.yearlyPrice > 0
      ? `월 ₩${Math.round(plan.yearlyPrice / 12).toLocaleString()} 수준`
      : "";

  return (
    <Card
      className={cn(
        "relative flex flex-col p-6",
        recommended && "ring-2 ring-primary shadow-prism-md",
        isElite && !recommended && "border-2 border-brand-accent",
      )}
    >
      {recommended && (
        <Badge variant="ai" size="sm" className="absolute -top-2.5 left-6">
          추천
        </Badge>
      )}

      <p className="text-h3 font-semibold text-foreground">{plan.displayName}</p>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-h1 font-bold tabular text-foreground">
          {price === 0 ? "무료" : `₩${price.toLocaleString()}`}
        </span>
        {period && <span className="text-small text-muted-foreground">{period}</span>}
      </div>
      {monthlyEquiv && (
        <p className="mt-0.5 text-caption text-muted-foreground">
          {monthlyEquiv} · {plan.yearlyDiscount}% 절약
        </p>
      )}

      <ul className="mt-4 flex-1 space-y-2">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-small text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-prism" aria-hidden />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {cta.href && !cta.disabled ? (
          <Button asChild className="w-full" variant={recommended ? "primary" : "secondary"}>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={recommended ? "primary" : "secondary"}
            disabled={cta.disabled || cta.busy}
            onClick={cta.onClick}
          >
            {cta.busy ? "처리 중…" : cta.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
