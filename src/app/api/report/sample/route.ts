/**
 * GET /api/report/sample
 *
 * 로그인 불필요 공개 엔드포인트 — 학부모 전환 깔때기 입구.
 * IP당 시간당 10회 rate limit으로 남용 방지.
 * PDF는 첫 요청 시 생성 → 모듈 스코프 캐시(재요청은 즉시 응답).
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSamplePdfBuffer } from "@/lib/report/pdf-generator";

// 폰트 CDN 접근과 초기 PDF 렌더는 수 초 걸릴 수 있음 — Edge 대신 Node 런타임.
export const runtime = "nodejs";

function getClientIp(req: NextRequest): string {
  // Vercel/프록시 환경: x-forwarded-for 첫 항목이 원 클라이언트.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  // enforceRateLimit는 uid를 문서 key로 쓰므로 IP 해시를 주입 — PII 회피 + 길이 고정.
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 24);

  const rateErr = await enforceRateLimit({
    bucket: "report_sample",
    uid: `ip-${ipHash}`,
    windowMs: 60 * 60 * 1000,
    limit: 10,
  });
  if (rateErr) return rateErr;

  try {
    const buffer = await getSamplePdfBuffer();
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="PRISM-sample-parent-report.pdf"',
        // 샘플은 불변 콘텐츠이니 CDN/브라우저 캐시 공격적으로.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[report/sample] pdf generation failed:", err);
    return NextResponse.json(
      { error: "샘플 PDF 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
