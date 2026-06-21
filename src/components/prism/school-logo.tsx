"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SchoolLogoProps {
  name: string;
  /** 폴백 체인 (school-logo.ts logoSources). 앞에서부터 시도, 실패 시 다음. */
  sources: string[];
  /** 컨테이너 크기·모양·배경 (예: "h-9 w-9 rounded-full bg-secondary") */
  className?: string;
  /** 이미지 fit (예: "object-contain p-2") */
  imgClassName?: string;
  /** 폴백 이니셜 글자 크기 (예: "text-h1") */
  letterClassName?: string;
}

/**
 * 학교 로고 — 여러 소스를 순서대로 시도하고(onError로 다음 소스), 모두 실패하면 이니셜.
 * 모든 소스가 raw <img>(외부 favicon/official icon이라 next/image 부적합) + loading="lazy".
 */
export function SchoolLogo({
  name,
  sources,
  className,
  imgClassName,
  letterClassName,
}: SchoolLogoProps) {
  const [idx, setIdx] = useState(0);
  const src = idx < sources.length ? sources[idx] : null;

  return (
    <div className={cn("flex items-center justify-center overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={name}
          loading="lazy"
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={() => setIdx((n) => n + 1)}
        />
      ) : (
        <span className={cn("font-display font-bold text-muted-foreground", letterClassName)}>
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}
