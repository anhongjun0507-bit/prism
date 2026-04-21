import { View, Text } from "@react-pdf/renderer";
import type { SampleReportData } from "@/lib/report/sample-data";
import { reportStyles } from "./SampleReportDocument";

export function ReportCoverPage({ data }: { data: SampleReportData }) {
  const probDelta = data.featuredSchool.probNow - data.featuredSchool.probPrev;

  return (
    <View>
      <View style={reportStyles.brandRow}>
        <Text style={reportStyles.brand}>PRISM</Text>
        <Text style={reportStyles.weekLabel}>{data.weekLabel} 주간 리포트</Text>
      </View>

      <Text style={reportStyles.sampleBadge}>샘플 리포트 · 실제 학생 정보 아님</Text>

      <Text style={reportStyles.h1}>{data.studentName}님의 이번 주</Text>
      <Text style={reportStyles.muted}>
        {data.grade} · {data.school} · 희망 전공 {data.major}
      </Text>

      <Text style={reportStyles.h2}>이번 주 핵심 지표</Text>
      <View style={reportStyles.metricsRow}>
        <View style={reportStyles.metricCard}>
          <Text style={reportStyles.metricLabel}>도전 / 적정 / 안정</Text>
          <Text style={reportStyles.metricValue}>
            {data.metrics.reach} · {data.metrics.target} · {data.metrics.safety}
          </Text>
        </View>
        <View style={reportStyles.metricCard}>
          <Text style={reportStyles.metricLabel}>이번 주 완료 과제</Text>
          <Text style={reportStyles.metricValue}>
            {data.metrics.tasksDone} / {data.metrics.tasksTotal}
          </Text>
        </View>
        <View style={[reportStyles.metricCard, reportStyles.metricCardLast]}>
          <Text style={reportStyles.metricLabel}>AI 상담 활용</Text>
          <Text style={reportStyles.metricValue}>{data.metrics.aiChats}회</Text>
        </View>
      </View>

      <View style={reportStyles.highlightBox}>
        <Text style={reportStyles.highlightTitle}>합격 가능성 변화</Text>
        <Text style={reportStyles.highlightValue}>
          {data.featuredSchool.name} {data.featuredSchool.probPrev}% → {data.featuredSchool.probNow}%
          {probDelta > 0 ? ` (+${probDelta}%p)` : probDelta < 0 ? ` (${probDelta}%p)` : ""}
        </Text>
      </View>

      <Text style={reportStyles.h2}>한 줄 요약</Text>
      <Text style={{ fontSize: 11, color: "#1F1B16", lineHeight: 1.6 }}>{data.oneLineSummary}</Text>

      <Text style={reportStyles.h2}>관심 대학별 합격 가능성 추이</Text>
      <View style={reportStyles.table}>
        <View style={[reportStyles.tableRow, reportStyles.tableHeader]}>
          <Text style={[reportStyles.col1, { fontWeight: 700 }]}>대학</Text>
          <Text style={[reportStyles.col2, { fontWeight: 700 }]}>구분</Text>
          <Text style={[reportStyles.col3, { fontWeight: 700 }]}>지난주</Text>
          <Text style={[reportStyles.col4, { fontWeight: 700 }]}>이번 주</Text>
        </View>
        {data.schools.map((s) => {
          const categoryLabel =
            s.category === "Reach" ? "도전" : s.category === "Safety" ? "안정" : "적정";
          return (
            <View key={s.name} style={reportStyles.tableRow}>
              <Text style={reportStyles.col1}>{s.name}</Text>
              <Text style={reportStyles.col2}>{categoryLabel}</Text>
              <Text style={reportStyles.col3}>{s.probPrev}%</Text>
              <Text style={reportStyles.col4}>{s.probNow}%</Text>
            </View>
          );
        })}
      </View>

      <View style={reportStyles.footer}>
        <Text>PRISM · prismedu.kr</Text>
        <Text>1 / 3</Text>
      </View>
    </View>
  );
}
