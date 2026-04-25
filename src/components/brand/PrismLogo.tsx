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
// Static gradient ids: if two full-variant logos coexist on the same page,
// the defs blocks are byte-identical so collision resolves to the first def
// without any visual change. Avoiding useId keeps this a Server Component.
const BEAM_IDS = ["prism-beam-1", "prism-beam-2", "prism-beam-3"] as const;

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
      {variant === "full" && !inverse && (
        <defs>
          {/* 3 vertical gradients — each beam fades from its tonal hue to transparent.
              CSS variables resolve at paint time, so light/dark mode swap is automatic
              without re-rendering the SVG. */}
          {BEAM_IDS.map((id, i) => {
            const cssVar = `--logo-beam-${i + 1}`;
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`hsl(var(${cssVar}))`} />
                <stop offset="100%" stopColor={`hsl(var(${cssVar}))`} stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>
      )}

      {/* Triangular prism — apex up, equilateral-ish for visual balance. */}
      <path
        d="M16 4 L28 25 H4 Z"
        fill={fill}
      />
      {variant === "full" && (
        <g strokeWidth={1.6} strokeLinecap="round">
          {/* 3 dispersed light beams below the prism base.
              inverse: simplified white (dark-bg use). non-inverse: distinct tonal gradients. */}
          {inverse ? (
            <g stroke="white" opacity={0.7}>
              <line x1="11" y1="27" x2="9" y2="31" />
              <line x1="16" y1="27" x2="16" y2="31" />
              <line x1="21" y1="27" x2="23" y2="31" />
            </g>
          ) : (
            <>
              <line x1="11" y1="27" x2="9" y2="31" stroke={`url(#${BEAM_IDS[0]})`} />
              <line x1="16" y1="27" x2="16" y2="31" stroke={`url(#${BEAM_IDS[1]})`} />
              <line x1="21" y1="27" x2="23" y2="31" stroke={`url(#${BEAM_IDS[2]})`} />
            </>
          )}
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
