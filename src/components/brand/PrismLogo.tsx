import { cn } from "@/lib/utils";

type LogoVariant = "full" | "compact" | "wordmark";

interface PrismLogoProps {
  /** rendered pixel size (mark only — wordmark grows by text). */
  size?: number;
  variant?: LogoVariant;
  /** white fill for dark backgrounds. */
  inverse?: boolean;
  className?: string;
  /** SR-only label. omit when wrapped in an already-labelled element. */
  title?: string;
}

/**
 * PRISM brand mark — solid terracotta triangle prism.
 *
 * Replaces the prior conic-gradient rainbow ("prism-logo-spectrum"), which read
 * as a toy/MZ aesthetic. New mark is single-color primary, with 3 dispersed
 * light beams (full variant) below the prism base.
 *
 * Variants:
 *   - "full"     — prism + 3 beams. Use ≥40px (beams readable).
 *   - "compact"  — prism only. Use ≤32px (favicon, sidebar mark).
 *   - "wordmark" — prism + "PRISM" text. Use in nav, footer.
 */
export function PrismLogo({
  size = 32,
  variant = "compact",
  inverse = false,
  className,
  title,
}: PrismLogoProps) {
  const fill = inverse ? "white" : "hsl(var(--primary))";

  const Mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Triangular prism — apex up, equilateral-ish for visual balance. */}
      <path
        d="M16 4 L28 25 H4 Z"
        fill={fill}
      />
      {variant === "full" && (
        <g
          stroke={fill}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.55}
        >
          {/* 3 dispersed light beams below the prism base. */}
          <line x1="11" y1="27" x2="9" y2="31" />
          <line x1="16" y1="27" x2="16" y2="31" />
          <line x1="21" y1="27" x2="23" y2="31" />
        </g>
      )}
    </svg>
  );

  if (variant === "wordmark") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        {Mark}
        <span
          className={cn(
            "font-bold tracking-tight",
            inverse ? "text-white" : "text-foreground",
          )}
          style={{ fontSize: Math.round(size * 0.7) }}
        >
          PRISM
        </span>
      </span>
    );
  }

  return <span className={cn("inline-flex", className)}>{Mark}</span>;
}
