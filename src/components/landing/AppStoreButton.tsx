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

export function AppStoreButton({ size = "default", source = "cta_button", className }: StoreButtonProps) {
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
