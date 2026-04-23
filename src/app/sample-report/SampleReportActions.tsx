"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Link2, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackPrismEvent } from "@/lib/analytics/events";

// Web Share API(모바일)가 있으면 카카오톡 공유 메뉴로 자연스럽게 이어짐.
// SDK 초기화/앱키 관리를 피하고 플랫폼 공유 시트에 위임.
export function SampleReportActions() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    // funnel: 클릭 시점 기록. 실제 다운로드 성공 여부는 server log로 확인.
    trackPrismEvent("sample_pdf_downloaded", {});
    try {
      // 새 탭에서 여는 대신 직접 이동 → 모바일 Safari에서 미리보기 후 저장이 자연스러움.
      window.location.href = "/api/report/sample";
    } finally {
      // redirect는 페이지를 떠나게 되므로 short timeout로만 상태 복원.
      setTimeout(() => setDownloading(false), 3000);
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sample-report`
      : "https://prismedu.kr/sample-report";

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "PRISM 학부모 주간 리포트 샘플",
          text: "AI가 매주 정리하는 우리 아이 입시 진척도 — 샘플을 받아보세요.",
          url: shareUrl,
        });
      } catch {
        // 사용자 취소는 조용히 무시.
      }
      return;
    }
    // Web Share 미지원 환경은 URL 복사로 폴백.
    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "링크를 복사했어요" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "복사 실패",
        description: "주소창의 URL을 직접 복사해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-sm mx-auto">
      <Button
        size="xl"
        className="w-full rounded-2xl font-bold text-base"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
            다운로드 준비 중...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" aria-hidden="true" />
            샘플 PDF 다운로드
          </>
        )}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={handleShare}>
          <Share2 className="w-4 h-4" aria-hidden="true" /> 공유
        </Button>
        <Button variant="outline" className="flex-1 gap-1.5" onClick={copyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> 복사됨
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" aria-hidden="true" /> 링크 복사
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
