"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * StorageQuotaBanner — localStorage write 실패를 사용자에게 가시화.
 *
 * lib/storage.ts의 writeString이 quota/private mode로 실패하면
 * "prism:storage-quota" 이벤트를 발행. 이 배너가 구독해 상단에 고정 노출.
 *
 * 이전엔 silent drop으로 데이터 손실을 사용자가 인지하지 못하는 문제가 있었음.
 * 중요 UX: 사용자가 "분석 결과가 왜 자꾸 사라지지?" 원인을 알 수 있어야 함.
 */
export function StorageQuotaBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onQuota = () => {
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("prism:storage-quota", onQuota as EventListener);
    return () => window.removeEventListener("prism:storage-quota", onQuota as EventListener);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[60] bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 backdrop-blur-sm"
    >
      <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto px-4 py-2.5 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            기기 저장소가 부족해요
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
            로그인 상태면 클라우드에 저장되니 계속 사용하셔도 돼요. 브라우저 저장 데이터를 정리하면 로컬 캐시도 복구됩니다.
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); setVisible(false); }}
          aria-label="배너 닫기"
          className="shrink-0 p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <X className="w-4 h-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
