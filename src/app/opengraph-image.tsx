import { ImageResponse } from "next/og";

/**
 * 루트 OpenGraph 이미지 (소셜 공유 미리보기). next/og 내장 ImageResponse — 새 패키지 0.
 * 한글 폰트 로딩 리스크를 피하려 Latin 브랜드 카드로 구성(default 폰트 → fetch 없이 항상 렌더).
 * (한글 태그라인 버전은 public/에 폰트 번들 후 후속 가능.)
 */
export const alt = "PRISM — AI U.S. college admissions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0B1220 0%, #312E81 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", width: "26px", height: "26px", borderRadius: "9999px", background: "#818CF8" }} />
          <span style={{ fontSize: "30px", letterSpacing: "5px", color: "#A5B4FC", fontWeight: 700 }}>
            AI · U.S. COLLEGE ADMISSIONS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "190px", fontWeight: 800, letterSpacing: "-6px", lineHeight: 1 }}>PRISM</span>
          <span style={{ fontSize: "46px", fontWeight: 600, color: "#C7D2FE", marginTop: "16px" }}>
            Find your best-fit universities in 3 seconds.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "27px", color: "#94A3B8" }}>
          <span style={{ fontWeight: 700, color: "#E2E8F0" }}>prismedu.kr</span>
          <span>admission odds · AI essay review · planner</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
