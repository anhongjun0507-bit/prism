import { Topbar } from "@/components/layout/Topbar";

/**
 * /more 스텁 — Step 5에서 컨텐츠 결정 (별도 페이지 vs Sheet/Drawer).
 * 현재는 BottomNav "더보기" 탭이 실제 경로를 가지도록만 보장.
 */
export default function MorePage() {
  return (
    <>
      <Topbar title="더보기" />
      <div className="space-y-4 p-6">
        <h1 className="text-h1 font-semibold">더보기</h1>
        <p className="text-body text-muted-foreground">
          Step 5에서 결정 — 별도 페이지(What-If · 스펙 분석 · 플래너 · 비교 ·
          설정 묶음) vs Sheet/Drawer.
        </p>
      </div>
    </>
  );
}
