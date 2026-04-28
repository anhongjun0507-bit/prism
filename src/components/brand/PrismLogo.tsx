import { cn } from "@/lib/utils";

type LogoVariant = "full" | "compact" | "wordmark";

interface PrismLogoProps {
  /** rendered pixel size (mark only — wordmark grows by text). */
  size?: number;
  variant?: LogoVariant;
  /** brighter glass on dark bg (splash, hero) — boosts white opacity. */
  inverse?: boolean;
  className?: string;
  /** SR-only label. omit when wrapped in an already-labelled element. */
  title?: string;
}

/**
 * PRISM brand mark — glassmorphism prism with refracted light beams.
 *
 * Layered SVG composition:
 *   1. Soft outer glow (terracotta halo)
 *   2. Translucent glass body (vertical primary gradient — light enters top)
 *   3. Specular highlight at apex (white ellipse — frosted-glass shine)
 *   4. Frosted edge stroke (white→fade vertical gradient)
 *   5. Bottom rim shadow line (depth)
 *   6. Five dispersed pastel beams (full variant — light refraction)
 *
 * Variants:
 *   - "full"     — prism + 5 beams. Use ≥48px.
 *   - "compact"  — prism only. Use ≤32px.
 *   - "wordmark" — prism + "PRISM" text.
 */
const BEAM_IDS = [
  "prism-beam-1",
  "prism-beam-2",
  "prism-beam-3",
  "prism-beam-4",
  "prism-beam-5",
] as const;

const BEAM_COLORS = ["#60A5FA", "#A78BFA", "#F472B6", "#FB923C", "#FBBF24"] as const;

export function PrismLogo({
  size = 32,
  variant = "compact",
  inverse = false,
  className,
  title,
}: PrismLogoProps) {
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
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Glass body: vertical translucent gradient. Top = lighter (light entering),
            bottom = denser primary. inverse uses white for dark backgrounds. */}
        <linearGradient id="prism-glass-body" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop
            offset="0%"
            stopColor={inverse ? "white" : "hsl(var(--primary))"}
            stopOpacity={inverse ? "0.55" : "0.92"}
          />
          <stop
            offset="100%"
            stopColor={inverse ? "white" : "hsl(var(--primary))"}
            stopOpacity={inverse ? "0.18" : "0.55"}
          />
        </linearGradient>
        {/* Apex specular highlight — soft white blob */}
        <radialGradient id="prism-glass-spec" cx="0.5" cy="0.2" r="0.5">
          <stop offset="0%" stopColor="white" stopOpacity={inverse ? "0.85" : "0.7"} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Frosted edge stroke */}
        <linearGradient id="prism-glass-edge" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={inverse ? "0.95" : "0.85"} />
          <stop offset="100%" stopColor="white" stopOpacity={inverse ? "0.35" : "0.2"} />
        </linearGradient>
        {/* Outer glow halo */}
        <radialGradient id="prism-glass-glow" cx="0.5" cy="0.5" r="0.55">
          <stop
            offset="0%"
            stopColor={inverse ? "white" : "hsl(var(--primary))"}
            stopOpacity={inverse ? "0.35" : "0.45"}
          />
          <stop offset="100%" stopColor={inverse ? "white" : "hsl(var(--primary))"} stopOpacity="0" />
        </radialGradient>
        {/* Beam gradients (full variant) */}
        {variant === "full" &&
          BEAM_IDS.map((id, i) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={inverse ? "white" : BEAM_COLORS[i]}
                stopOpacity={inverse ? "0.85" : "0.95"}
              />
              <stop
                offset="100%"
                stopColor={inverse ? "white" : BEAM_COLORS[i]}
                stopOpacity="0"
              />
            </linearGradient>
          ))}
      </defs>

      {/* 1. Outer halo — extends past viewBox via overflow:visible */}
      <circle cx="16" cy="15" r="14" fill="url(#prism-glass-glow)" />

      {/* 2. Glass body */}
      <path
        d="M16 4 L28 25 H4 Z"
        fill="url(#prism-glass-body)"
      />

      {/* 3. Apex specular highlight (frosted shine) */}
      <ellipse cx="16" cy="9.5" rx="4.5" ry="2.2" fill="url(#prism-glass-spec)" />

      {/* 4. Frosted edge stroke */}
      <path
        d="M16 4 L28 25 H4 Z"
        fill="none"
        stroke="url(#prism-glass-edge)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 5. Bottom rim — subtle depth line */}
      <line
        x1="6"
        y1="25"
        x2="26"
        y2="25"
        stroke={inverse ? "white" : "hsl(var(--primary))"}
        strokeOpacity={inverse ? "0.5" : "0.65"}
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      {/* 6. Refracted light beams (full variant) */}
      {variant === "full" && (
        <g strokeWidth={1.4} strokeLinecap="round">
          <line x1="9" y1="27" x2="7" y2="31.5" stroke={`url(#${BEAM_IDS[0]})`} />
          <line x1="12.5" y1="27" x2="11.5" y2="31.5" stroke={`url(#${BEAM_IDS[1]})`} />
          <line x1="16" y1="27" x2="16" y2="31.5" stroke={`url(#${BEAM_IDS[2]})`} />
          <line x1="19.5" y1="27" x2="20.5" y2="31.5" stroke={`url(#${BEAM_IDS[3]})`} />
          <line x1="23" y1="27" x2="25" y2="31.5" stroke={`url(#${BEAM_IDS[4]})`} />
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
