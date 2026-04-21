import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PRISM 학부모 주간 리포트 샘플";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SampleReportOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 50%, #FDBA74 100%)",
          fontFamily: "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(194,65,12,0.12)",
            color: "#9A3412",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 24,
            letterSpacing: 0.5,
          }}
        >
          학부모 전용 샘플
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1F1B16",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          AI가 매주 정리하는
          <br />
          우리 아이 입시 진척도
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#6B6258",
            textAlign: "center",
            maxWidth: 860,
          }}
        >
          3페이지 샘플 PDF · 로그인 없이 바로 다운로드
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "14px 28px",
            background: "#EA580C",
            color: "white",
            fontSize: 22,
            fontWeight: 700,
            borderRadius: 16,
          }}
        >
          prismedu.kr/sample-report
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#9A3412",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          PRISM
        </div>
      </div>
    ),
    { ...size }
  );
}
