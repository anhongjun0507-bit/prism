"use client";

import Link from "next/link";
import { Apple, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_STORE_URLS } from "@/lib/app-stores";
import { trackPrismEvent } from "@/lib/analytics/events";

type Source = "cta_button" | "bottom_section";
type Size = "default" | "lg";

interface StoreButtonProps {
  size?: Size;
  source?: Source;
  className?: string;
}

// URL이 "#" placeholder면 "곧 출시" disabled 상태로 렌더 — 깨진 링크 클릭/오추적 차단.
// 환경변수가 채워지면 자동으로 활성 링크로 전환되는 구조.
function isPlaceholder(url: string) {
  return url === "#";
}

function ComingSoonButton({
  icon: Icon,
  label,
  size,
  className,
}: {
  icon: typeof Apple;
  label: string;
  size: Size;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="default"
      size={size}
      className={className}
      disabled
      aria-disabled="true"
      aria-label={`${label} — 곧 출시`}
      title="곧 출시"
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      {label}
      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-white/20">
        곧 출시
      </span>
    </Button>
  );
}

export function AppStoreButton({ size = "default", source = "cta_button", className }: StoreButtonProps) {
  if (isPlaceholder(APP_STORE_URLS.ios)) {
    return <ComingSoonButton icon={Apple} label="App Store" size={size} className={className} />;
  }
  return (
    <Button asChild variant="default" size={size} className={className}>
      <Link
        href={APP_STORE_URLS.ios}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="App Store에서 PRISM 다운로드"
        onClick={() => trackPrismEvent("pricing_app_download_clicked", { platform: "ios", source })}
      >
        <Apple className="w-5 h-5" aria-hidden="true" />
        App Store
      </Link>
    </Button>
  );
}

export function PlayStoreButton({ size = "default", source = "cta_button", className }: StoreButtonProps) {
  if (isPlaceholder(APP_STORE_URLS.android)) {
    return <ComingSoonButton icon={Play} label="Google Play" size={size} className={className} />;
  }
  return (
    <Button asChild variant="default" size={size} className={className}>
      <Link
        href={APP_STORE_URLS.android}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Google Play에서 PRISM 다운로드"
        onClick={() => trackPrismEvent("pricing_app_download_clicked", { platform: "android", source })}
      >
        <Play className="w-5 h-5" aria-hidden="true" />
        Google Play
      </Link>
    </Button>
  );
}
