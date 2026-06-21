/**
 * 3 · 제품 시연 (센터피스) — 이번 단계엔 빈 sticky placeholder만.
 * 다음 단계(1B)에서 pin + scrub 5씬 타임라인 구현(§4).
 * 앵커 id(#demo / #demo-stage)는 1B 메커니즘과 동일하게 미리 배치.
 */
export function DemoPlaceholder() {
  return (
    <section id="demo" aria-label="제품 시연" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 1B에서 섹션 높이를 늘리고(예: 500vh) 이 stage를 pin 고정 예정. */}
        <div
          id="demo-stage"
          className="grid place-items-center py-20 md:min-h-dvh"
        >
          <div className="w-full max-w-3xl rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-caption font-medium uppercase text-muted-foreground">
              Centerpiece
            </p>
            <p className="mt-3 text-h2-sm font-semibold text-foreground sm:text-h2">
              스크롤 고정 제품 시연
            </p>
            <p className="mx-auto mt-3 max-w-md text-small text-muted-foreground">
              합격 분석 · 실시간 에세이 첨삭 · 핏 근거 · 리포트까지, 스크롤에
              맞춰 펼쳐지는 시연 구간입니다. (다음 단계에서 구현)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
