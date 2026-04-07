"use client";

import { useState, useEffect } from "react";

/**
 * Returns a Clearbit logo URL for the given domain.
 * Falls back to Google favicon if Clearbit fails.
 */
export function getLogoUrl(domain: string, size = 128): string {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * SchoolLogo — shows university logo with colored fallback
 */
export function SchoolLogo({
  domain,
  color,
  name,
  rank,
  size = "md",
  className = "",
}: {
  domain: string;
  color: string;
  name: string;
  rank?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [useFavicon, setUseFavicon] = useState(false);

  const sizeMap = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-11 h-11 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
  };

  const logoSize = size === "sm" ? 64 : size === "lg" ? 128 : 80;

  if (imgError) {
    // Colored fallback with rank
    return (
      <div
        className={`${sizeMap[size]} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${className}`}
        style={{ backgroundColor: color }}
      >
        {rank ? `#${rank}` : name.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} shrink-0 shadow-sm overflow-hidden bg-white flex items-center justify-center border border-gray-100 ${className}`}
    >
      <img
        src={useFavicon ? getFaviconUrl(domain) : getLogoUrl(domain, logoSize)}
        alt={`${name} logo`}
        className="w-[70%] h-[70%] object-contain"
        loading="lazy"
        onError={() => {
          if (!useFavicon) {
            setUseFavicon(true);
          } else {
            setImgError(true);
          }
        }}
      />
    </div>
  );
}

/**
 * CampusPhoto — fetches campus image from Wikipedia with colored gradient fallback
 */
export function CampusPhoto({
  schoolName,
  color,
  className = "",
  children,
}: {
  schoolName: string;
  color: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Fetch from Wikipedia on mount — try multiple name variations
  useEffect(() => {
    setImageUrl(null);
    setLoaded(false);
    setError(false);

    // Try multiple Wikipedia article name formats
    const variations = [
      schoolName,
      schoolName + " University",
      schoolName.replace(/ U$/, " University"),
      schoolName.replace(/^U of /, "University of "),
      schoolName.replace(/ College$/, ""),
    ];

    // Remove duplicates
    const unique = [...new Set(variations.map(v => v.replace(/ /g, "_")))];

    let found = false;
    const tryNext = (index: number) => {
      if (index >= unique.length || found) {
        if (!found) setError(true);
        return;
      }
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(unique[index])}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.thumbnail?.source && !found) {
            found = true;
            const src = data.originalimage?.source || data.thumbnail.source;
            setImageUrl(src);
          } else {
            tryNext(index + 1);
          }
        })
        .catch(() => tryNext(index + 1));
    };
    tryNext(0);
  }, [schoolName]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: color }}>
      {imageUrl && !error && (
        <img
          src={imageUrl}
          alt={`${schoolName} campus`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-30" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${color}99 0%, ${color}dd 60%, ${color} 100%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
