import { Document, Page, StyleSheet, Font } from "@react-pdf/renderer";
import type { SampleReportData } from "@/lib/report/sample-data";
import { ReportCoverPage } from "./ReportCoverPage";
import { ReportAcademicPage } from "./ReportAcademicPage";
import { ReportParentPage } from "./ReportParentPage";

// @react-pdf는 시스템 폰트를 쓰지 않으므로 한글 렌더링엔 TTF embed 필수.
// Pretendard는 SIL OFL 라이선스로 재배포 허용, jsdelivr CDN이 안정적.
// 서버가 외부 네트워크를 못 타는 환경이면 TTF를 public/fonts/로 self-host.
let fontsRegistered = false;
export function ensureFontsRegistered() {
  if (fontsRegistered) return;
  Font.register({
    family: "Pretendard",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-SemiBold.otf",
        fontWeight: 600,
      },
      {
        src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf",
        fontWeight: 700,
      },
    ],
  });
  fontsRegistered = true;
}

export const reportStyles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Pretendard",
    fontSize: 10,
    color: "#1F1B16",
    lineHeight: 1.5,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E0D7",
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: "#EA580C",
    letterSpacing: 0.4,
  },
  weekLabel: {
    fontSize: 9,
    color: "#6B6258",
  },
  sampleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7ED",
    color: "#C2410C",
    fontSize: 8,
    fontWeight: 700,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: "#1F1B16",
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    color: "#1F1B16",
  },
  muted: {
    color: "#6B6258",
    fontSize: 9,
  },
  metricsRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 10,
    marginRight: 6,
  },
  metricCardLast: {
    marginRight: 0,
  },
  metricLabel: {
    fontSize: 8,
    color: "#9A9086",
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1F1B16",
  },
  highlightBox: {
    backgroundColor: "#FEF3E2",
    borderLeftWidth: 3,
    borderLeftColor: "#EA580C",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "#9A3412",
    marginBottom: 3,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1F1B16",
  },
  table: {
    marginTop: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E0D7",
    paddingTop: 6,
    paddingBottom: 6,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#1F1B16",
  },
  col1: { flex: 2, fontSize: 10 },
  col2: { flex: 1.2, fontSize: 10 },
  col3: { flex: 1.2, fontSize: 10 },
  col4: { flex: 1, fontSize: 10, textAlign: "right" },
  bullet: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#EA580C",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  listItemTitle: {
    fontWeight: 600,
    fontSize: 10,
    marginBottom: 2,
  },
  listItemDetail: {
    fontSize: 9,
    color: "#6B6258",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9A9086",
  },
  ctaBox: {
    marginTop: 18,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  ctaTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9A3412",
    marginBottom: 4,
  },
  ctaDetail: {
    fontSize: 9,
    color: "#7C2D12",
    marginBottom: 6,
  },
  ctaLink: {
    fontSize: 10,
    fontWeight: 700,
    color: "#EA580C",
  },
});

export function SampleReportDocument({ data }: { data: SampleReportData }) {
  return (
    <Document
      title={`PRISM 학부모 주간 리포트 샘플 — ${data.studentName}`}
      author="PRISM"
      subject="AI 기반 입시 주간 리포트"
    >
      <Page size="A4" style={reportStyles.page} wrap>
        <ReportCoverPage data={data} />
      </Page>
      <Page size="A4" style={reportStyles.page} wrap>
        <ReportAcademicPage data={data} />
      </Page>
      <Page size="A4" style={reportStyles.page} wrap>
        <ReportParentPage data={data} />
      </Page>
    </Document>
  );
}
