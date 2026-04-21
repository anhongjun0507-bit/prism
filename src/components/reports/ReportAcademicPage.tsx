import { View, Text } from "@react-pdf/renderer";
import type { SampleReportData } from "@/lib/report/sample-data";
import { reportStyles } from "./SampleReportDocument";

const STATUS_LABEL: Record<"above" | "match" | "below", string> = {
  above: "목표 평균 이상",
  match: "목표 평균 수준",
  below: "보완 필요",
};

const STATUS_COLOR: Record<"above" | "match" | "below", string> = {
  above: "#15803D",
  match: "#1F1B16",
  below: "#C2410C",
};

export function ReportAcademicPage({ data }: { data: SampleReportData }) {
  return (
    <View>
      <View style={reportStyles.brandRow}>
        <Text style={reportStyles.brand}>PRISM</Text>
        <Text style={reportStyles.weekLabel}>학업 진단</Text>
      </View>

      <Text style={reportStyles.h1}>학업 진단</Text>
      <Text style={reportStyles.muted}>
        {data.studentName}님의 현재 스펙과 목표 대학 합격자 평균 비교
      </Text>

      <Text style={reportStyles.h2}>스펙 비교</Text>
      <View style={reportStyles.table}>
        <View style={[reportStyles.tableRow, reportStyles.tableHeader]}>
          <Text style={[reportStyles.col1, { fontWeight: 700 }]}>항목</Text>
          <Text style={[reportStyles.col2, { fontWeight: 700 }]}>민준님</Text>
          <Text style={[reportStyles.col3, { fontWeight: 700 }]}>합격자 평균</Text>
          <Text style={[reportStyles.col4, { fontWeight: 700 }]}>판정</Text>
        </View>
        {data.specs.map((row) => (
          <View key={row.label} style={reportStyles.tableRow}>
            <Text style={reportStyles.col1}>{row.label}</Text>
            <Text style={reportStyles.col2}>{row.value}</Text>
            <Text style={reportStyles.col3}>{row.targetAverage}</Text>
            <Text style={[reportStyles.col4, { color: STATUS_COLOR[row.status], fontWeight: 600 }]}>
              {STATUS_LABEL[row.status]}
            </Text>
          </View>
        ))}
      </View>

      <Text style={reportStyles.h2}>강점</Text>
      {data.strengths.map((s, i) => (
        <View key={i} style={reportStyles.bullet}>
          <Text style={reportStyles.bulletDot}>✓</Text>
          <Text style={reportStyles.bulletText}>{s}</Text>
        </View>
      ))}

      <Text style={reportStyles.h2}>보완하면 좋은 점</Text>
      {data.weaknesses.map((w, i) => (
        <View key={i} style={reportStyles.bullet}>
          <Text style={reportStyles.bulletDot}>!</Text>
          <Text style={reportStyles.bulletText}>{w}</Text>
        </View>
      ))}

      <Text style={reportStyles.h2}>향후 3개월 우선순위</Text>
      {data.priorities.map((p, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <Text style={reportStyles.listItemTitle}>
            {i + 1}. {p.title}
          </Text>
          <Text style={reportStyles.listItemDetail}>{p.detail}</Text>
        </View>
      ))}

      <View style={reportStyles.footer}>
        <Text>PRISM · prismedu.kr</Text>
        <Text>2 / 3</Text>
      </View>
    </View>
  );
}
