"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — 콘텐츠가 없을 때 매력적으로 비어 있게 한다.
 * 각 illustration은 inline SVG (외부 의존 없음, 다크모드/색 토큰 자동 대응).
 */

interface EmptyStateProps {
  illustration: "essay" | "school" | "task" | "chat" | "analysis";
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center px-6 py-10", className)}>
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Soft gradient halo behind illustration */}
        <div className="absolute inset-0 rounded-full bg-prismatic-soft blur-2xl opacity-60" aria-hidden="true" />
        <div className="relative w-full h-full flex items-center justify-center">
          {illustration === "essay" && <EssayIllustration />}
          {illustration === "school" && <SchoolIllustration />}
          {illustration === "task" && <TaskIllustration />}
          {illustration === "chat" && <ChatIllustration />}
          {illustration === "analysis" && <AnalysisIllustration />}
        </div>
      </div>
      <h3 className="font-headline font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/* ─── Illustrations ─── */

function EssayIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28" aria-hidden="true">
      {/* Paper sheet */}
      <rect x="32" y="20" width="56" height="76" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="2" />
      {/* Lines */}
      <line x1="40" y1="34" x2="76" y2="34" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="44" x2="80" y2="44" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="54" x2="72" y2="54" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="64" x2="78" y2="64" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="74" x2="68" y2="74" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      {/* Pen */}
      <g transform="rotate(35 80 80)">
        <rect x="78" y="58" width="6" height="36" rx="2" fill="hsl(var(--primary))" />
        <polygon points="78,94 84,94 81,102" fill="hsl(var(--primary))" />
        <rect x="78" y="56" width="6" height="6" rx="1" fill="hsl(28, 85%, 52%)" />
      </g>
      {/* Sparkles */}
      <g className="animate-pulse" style={{ transformOrigin: "center", animation: "pulse 2s ease-in-out infinite" }}>
        <circle cx="28" cy="28" r="2.5" fill="hsl(38, 92%, 60%)" />
        <circle cx="92" cy="32" r="2" fill="hsl(265, 84%, 65%)" />
        <circle cx="100" cy="80" r="2.5" fill="hsl(330, 81%, 60%)" />
      </g>
    </svg>
  );
}

function SchoolIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28" aria-hidden="true">
      {/* Ground */}
      <line x1="20" y1="100" x2="100" y2="100" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.2" strokeWidth="2" />
      {/* Building */}
      <rect x="40" y="50" width="40" height="50" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Roof */}
      <polygon points="36,50 60,30 84,50" fill="hsl(var(--primary))" />
      {/* Door */}
      <rect x="54" y="76" width="12" height="24" rx="1" fill="hsl(var(--primary))" fillOpacity="0.8" />
      {/* Windows */}
      <rect x="46" y="58" width="8" height="8" rx="1" fill="hsl(217, 91%, 60%)" fillOpacity="0.4" />
      <rect x="66" y="58" width="8" height="8" rx="1" fill="hsl(217, 91%, 60%)" fillOpacity="0.4" />
      {/* Heart floating above */}
      <g transform="translate(60 18)">
        <path
          d="M0,4 C-4,-4 -12,-2 -12,4 C-12,10 0,18 0,18 C0,18 12,10 12,4 C12,-2 4,-4 0,4 Z"
          fill="hsl(var(--primary))"
          opacity="0.85"
        />
      </g>
      {/* Sparkles */}
      <circle cx="22" cy="40" r="2" fill="hsl(38, 92%, 60%)" opacity="0.7" />
      <circle cx="98" cy="48" r="2.5" fill="hsl(265, 84%, 65%)" opacity="0.7" />
    </svg>
  );
}

function TaskIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28" aria-hidden="true">
      {/* Calendar body */}
      <rect x="28" y="34" width="64" height="60" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Header */}
      <rect x="28" y="34" width="64" height="14" rx="6" fill="hsl(var(--primary))" />
      <rect x="28" y="40" width="64" height="8" fill="hsl(var(--primary))" />
      {/* Hangers */}
      <rect x="40" y="26" width="4" height="14" rx="2" fill="hsl(var(--primary))" />
      <rect x="76" y="26" width="4" height="14" rx="2" fill="hsl(var(--primary))" />
      {/* Grid dots */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={40 + col * 13}
            cy={62 + row * 12}
            r="1.5"
            fill="hsl(var(--muted-foreground))"
            opacity="0.3"
          />
        ))
      )}
      {/* Checkmark in big circle */}
      <circle cx="78" cy="86" r="14" fill="hsl(160, 60%, 45%)" />
      <path d="M71,86 L76,91 L85,82" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28" aria-hidden="true">
      {/* Big bubble */}
      <path
        d="M30,38 Q30,28 40,28 L80,28 Q90,28 90,38 L90,68 Q90,78 80,78 L52,78 L42,90 L42,78 L40,78 Q30,78 30,68 Z"
        fill="hsl(var(--primary))"
      />
      {/* Sparkles inside */}
      <g fill="white">
        <circle cx="48" cy="50" r="2" />
        <circle cx="60" cy="46" r="3" />
        <circle cx="60" cy="58" r="2" />
        <circle cx="72" cy="52" r="2.5" />
      </g>
      {/* Small bubble */}
      <ellipse cx="98" cy="92" rx="14" ry="10" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="93" cy="92" r="1.5" fill="hsl(var(--primary))" />
      <circle cx="98" cy="92" r="1.5" fill="hsl(var(--primary))" />
      <circle cx="103" cy="92" r="1.5" fill="hsl(var(--primary))" />
    </svg>
  );
}

function AnalysisIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28" aria-hidden="true">
      {/* Axis */}
      <line x1="28" y1="92" x2="92" y2="92" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="28" y1="92" x2="28" y2="28" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.3" strokeWidth="2" />
      {/* Bars (with brand color spectrum) */}
      <rect x="36" y="64" width="10" height="28" rx="2" fill="hsl(0, 75%, 60%)" />
      <rect x="50" y="52" width="10" height="40" rx="2" fill="hsl(38, 92%, 55%)" />
      <rect x="64" y="40" width="10" height="52" rx="2" fill="hsl(217, 91%, 60%)" />
      <rect x="78" y="32" width="10" height="60" rx="2" fill="hsl(160, 60%, 45%)" />
      {/* Trend line */}
      <polyline
        points="41,64 55,52 69,40 83,32"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <circle cx="86" cy="22" r="3" fill="hsl(38, 92%, 60%)" />
      <circle cx="22" cy="42" r="2" fill="hsl(265, 84%, 65%)" />
    </svg>
  );
}
