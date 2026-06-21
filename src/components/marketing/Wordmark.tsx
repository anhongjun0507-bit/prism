import { cn } from "@/lib/utils";

/**
 * Wordmark — PRISM 로고 락업(프리즘 그라데이션 배지 + 워드마크).
 * 100% 토큰 기반: 배지=.bg-prism-gradient, 글자색=currentColor(섹션 테마 자동 대응).
 * 랜딩 전용 자체 컴포넌트(기존 앱 컴포넌트 미재사용).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="bg-prism-gradient grid h-7 w-7 place-items-center rounded-md font-display text-small font-bold leading-none text-white"
      >
        P
      </span>
      <span className="font-display text-h3 font-bold tracking-tight">PRISM</span>
    </span>
  );
}
