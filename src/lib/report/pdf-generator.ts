import "server-only";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { SAMPLE_REPORT } from "./sample-data";
import { SampleReportDocument, ensureFontsRegistered } from "@/components/reports/SampleReportDocument";

// 첫 요청 시 PDF 생성 → 모듈 스코프 Promise로 고정.
// 샘플은 콘텐츠가 고정이라 재생성할 이유가 없음. 서버리스 인스턴스 기준 1회만 비용 발생.
// 만약 콘텐츠를 업데이트하고 싶다면 배포(새 인스턴스)로 자연스럽게 초기화.
let cachedPromise: Promise<Buffer> | null = null;

export function getSamplePdfBuffer(): Promise<Buffer> {
  if (cachedPromise) return cachedPromise;
  cachedPromise = (async () => {
    ensureFontsRegistered();
    // 타입 경계: renderToBuffer는 ReactElement<DocumentProps>를 받는다.
    // SampleReportDocument는 내부에서 <Document>를 렌더링하는 래퍼지만, 외부 타입은
    // 커스텀 props({ data })라 TS가 불일치를 잡는다. 런타임엔 Document가 반환되므로 캐스팅 안전.
    const element = createElement(SampleReportDocument, {
      data: SAMPLE_REPORT,
    }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    return buffer;
  })().catch((err) => {
    // 실패 시 캐시를 비워 다음 요청에서 재시도 가능하게.
    cachedPromise = null;
    throw err;
  });
  return cachedPromise;
}
