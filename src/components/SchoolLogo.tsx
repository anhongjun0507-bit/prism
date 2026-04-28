"use client";

import { useState, useEffect, useMemo, memo } from "react";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/api-client";

/* ─── Logo source cache (skip the failed-image fallback chain on remount) ─── */
const LOGO_CACHE_PREFIX = "logo_cache_";
const LOGO_CACHE_INDEX = "logo_cache__index";
const LOGO_CACHE_MAX = 100;
type LogoSource = "ddg" | "favicon" | "none";

function getCachedSource(domain: string): LogoSource | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(LOGO_CACHE_PREFIX + domain);
    if (v === "ddg" || v === "favicon" || v === "none") return v;
    // 레거시 "clearbit" 캐시는 무시 (Clearbit free tier 종료 — 다음 마운트에서 DDG로 새로 시도)
  } catch {}
  return null;
}

function setCachedSource(domain: string, source: LogoSource) {
  if (typeof window === "undefined") return;
  // LRU — 이전엔 키가 무한 누적돼 localStorage quota를 잠식했음.
  // write 시 MRU index 갱신, 상한 초과분은 evict.
  try {
    localStorage.setItem(LOGO_CACHE_PREFIX + domain, source);
    const rawIdx = localStorage.getItem(LOGO_CACHE_INDEX);
    const idx: string[] = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    const filtered = idx.filter((d) => d !== domain);
    filtered.unshift(domain);
    if (filtered.length > LOGO_CACHE_MAX) {
      const evicted = filtered.splice(LOGO_CACHE_MAX);
      for (const d of evicted) localStorage.removeItem(LOGO_CACHE_PREFIX + d);
    }
    localStorage.setItem(LOGO_CACHE_INDEX, JSON.stringify(filtered));
  } catch {}
}

/**
 * DuckDuckGo Icons API — auth 불필요, 무료, 무제한, 프라이버시 친화적.
 * Clearbit (HubSpot 인수 후 free tier 종료) 대체.
 * 참고: https://icons.duckduckgo.com/ip3/{domain}.ico
 */
export function getLogoUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/** Google favicon — DDG 실패 시 fallback. sz=128로 비교적 선명. */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * Google favicons API는 미존재 도메인에도 200 + 16x16 generic globe를 반환.
 * → onError 발화 안 하므로 naturalWidth로 사후 검증.
 *
 * 임계값 32px: Google generic globe는 16x16 또는 32x32, 정상 favicon은 보통 64+.
 * DDG는 64x64 이상 반환 (없으면 404 → onError 발화).
 */
const MIN_LOGO_WIDTH_PX = 33;

const sizeMap = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-11 h-11 rounded-xl",
  lg: "w-14 h-14 rounded-2xl",
} as const;

const sizePx = { sm: 32, md: 44, lg: 56 } as const;

/**
 * SchoolLogo — shows university logo with colored fallback.
 * Caches resolved source per domain in localStorage so repeated mounts
 * (e.g. virtual scroll) skip the Clearbit→favicon→error fallback chain.
 */
function SchoolLogoBase({
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
  const cached = useMemo(() => getCachedSource(domain), [domain]);
  const [imgError, setImgError] = useState(cached === "none");
  const [useFavicon, setUseFavicon] = useState(cached === "favicon");

  // Fallback chain: DDG (primary) → Google favicon → 색상 placeholder
  const src = useMemo(
    () => (useFavicon ? getFaviconUrl(domain) : getLogoUrl(domain)),
    [domain, useFavicon]
  );

  if (imgError) {
    return (
      <div
        className={`${sizeMap[size]} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${className}`}
        style={{ backgroundColor: color }}
      >
        {rank ? `#${rank}` : name.slice(0, 2)}
      </div>
    );
  }

  // 작은 favicon(.ico)은 Next의 최적화 파이프라인을 거칠 필요가 없어 unoptimized.
  // 그래도 next/Image를 쓰는 이유: layout shift 방지(width/height), 일관된 렌더링, loading/decoding 기본값.
  const px = sizePx[size];
  return (
    <div
      className={`${sizeMap[size]} shrink-0 shadow-sm overflow-hidden bg-white dark:bg-card flex items-center justify-center border border-border p-1.5 ${className}`}
    >
      <Image
        src={src}
        alt=""
        width={Math.round(px * 0.55)}
        height={Math.round(px * 0.55)}
        className="object-contain"
        loading="lazy"
        unoptimized
        aria-hidden="true"
        onLoad={(e) => {
          // Google API의 generic globe 검출: naturalWidth ≤ 32 → 실패로 간주.
          // (Armstrong State 등 미존재/리다이렉트 도메인 대응)
          const img = e.currentTarget as HTMLImageElement;
          if (img.naturalWidth > 0 && img.naturalWidth < MIN_LOGO_WIDTH_PX) {
            if (!useFavicon) {
              setUseFavicon(true);
            } else {
              setCachedSource(domain, "none");
              setImgError(true);
            }
            return;
          }
          if (!cached) setCachedSource(domain, useFavicon ? "favicon" : "ddg");
        }}
        onError={() => {
          if (!useFavicon) {
            setUseFavicon(true);
          } else {
            setCachedSource(domain, "none");
            setImgError(true);
          }
        }}
      />
    </div>
  );
}

export const SchoolLogo = memo(SchoolLogoBase);

/* ─── CampusPhoto: Wikipedia URL cache (avoid refetch on every modal open) ─── */
const CAMPUS_CACHE_PREFIX = "campus_cache_";
const CAMPUS_CACHE_INDEX = "campus_cache__index";
const CAMPUS_CACHE_MAX = 50;

function getCachedCampusUrl(schoolName: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CAMPUS_CACHE_PREFIX + schoolName);
    return v && v !== "__none__" ? v : null;
  } catch { return null; }
}

function isCampusKnownMissing(schoolName: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CAMPUS_CACHE_PREFIX + schoolName) === "__none__";
  } catch { return false; }
}

function setCachedCampusUrl(schoolName: string, url: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAMPUS_CACHE_PREFIX + schoolName, url || "__none__");
    const rawIdx = localStorage.getItem(CAMPUS_CACHE_INDEX);
    const idx: string[] = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    const filtered = idx.filter((n) => n !== schoolName);
    filtered.unshift(schoolName);
    if (filtered.length > CAMPUS_CACHE_MAX) {
      const evicted = filtered.splice(CAMPUS_CACHE_MAX);
      for (const n of evicted) localStorage.removeItem(CAMPUS_CACHE_PREFIX + n);
    }
    localStorage.setItem(CAMPUS_CACHE_INDEX, JSON.stringify(filtered));
  } catch {}
}

/**
 * CampusPhoto — 학교 캠퍼스 사진을 표시. 사진 없으면 학교 색상 그라디언트로 폴백.
 *
 * 이미지 URL은 서버 프록시(/api/campus-photo)로 가져옴 — Wikipedia 직접 호출 안 함.
 * (rate limit, User-Agent 정책, 변형 시도 중복 회피)
 *
 * 캐시: localStorage(즉시 렌더) → 미스 시 서버 호출 → 결과 localStorage에 기록.
 */
function CampusPhotoBase({
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
  const [imageUrl, setImageUrl] = useState<string | null>(() => getCachedCampusUrl(schoolName));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // localStorage 캐시 hit이면 즉시 렌더, 추가 fetch 안 함
    const cached = getCachedCampusUrl(schoolName);
    if (cached) {
      setImageUrl(cached);
      return;
    }
    if (isCampusKnownMissing(schoolName)) {
      setError(true);
      return;
    }

    setImageUrl(null);
    setLoaded(false);
    setError(false);

    const controller = new AbortController();
    fetchWithAuth<{ url: string | null }>(
      `/api/campus-photo?school=${encodeURIComponent(schoolName)}`,
      { signal: controller.signal }
    )
      .then((data) => {
        if (data.url) {
          setCachedCampusUrl(schoolName, data.url);
          setImageUrl(data.url);
        } else {
          setCachedCampusUrl(schoolName, null); // known missing
          setError(true);
        }
      })
      .catch((e) => {
        // AbortError는 정상 (re-mount 또는 unmount). 그 외는 silent — 그라디언트 fallback으로 충분.
        if (e?.name !== "AbortError") {
          setError(true);
        }
      });

    return () => controller.abort();
  }, [schoolName]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: color }}>
      {imageUrl && !error && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-30" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          aria-hidden="true"
        />
      )}
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

export const CampusPhoto = memo(CampusPhotoBase);
