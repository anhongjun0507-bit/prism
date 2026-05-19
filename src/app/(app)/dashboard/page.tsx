import { MetricCard } from "@/components/prism/metric-card";
import { DistributionBar } from "@/components/prism/distribution-bar";
import { Topbar } from "@/components/layout/Topbar";

/**
 * /dashboard 스텁 — Step 5에서 본격 구현.
 * 현재는 Step 4 셸과 Step 3 시그니처 컴포넌트가 함께 동작하는지 검증용.
 */
export default function DashboardPage() {
  return (
    <>
      <Topbar title="대시보드" />
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-h1 font-semibold">대시보드</h1>
          <p className="text-body text-muted-foreground">
            Step 5에서 본격 구현 — 현재는 셸 검증용 스텁입니다.
          </p>
        </div>

        <MetricCard
          label="분석된 학교 수"
          value={23}
          suffix="개"
          size="md"
        >
          <DistributionBar safety={8} match={10} reach={5} />
        </MetricCard>

        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="mb-2 text-h2 font-semibold">진짜 PRISM처럼 보이는가?</h2>
          <p className="text-body text-muted-foreground">
            모바일이면 상단 Topbar "대시보드" + 하단 BottomNav 5탭(홈 활성)이
            보입니다. 데스크톱이면 좌측 Sidebar 240px가 보이고 BottomNav는
            숨김. 라이트/다크 토글이 데스크톱은 Sidebar 하단, 모바일은 (public)
            우상단 또는 향후 /more 페이지에서 동작.
          </p>
        </div>
      </div>
    </>
  );
}
