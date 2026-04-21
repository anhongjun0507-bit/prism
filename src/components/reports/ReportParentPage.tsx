import { View, Text } from "@react-pdf/renderer";
import type { SampleReportData } from "@/lib/report/sample-data";
import { reportStyles } from "./SampleReportDocument";

export function ReportParentPage({ data }: { data: SampleReportData }) {
  return (
    <View>
      <View style={reportStyles.brandRow}>
        <Text style={reportStyles.brand}>PRISM</Text>
        <Text style={reportStyles.weekLabel}>부모님께</Text>
      </View>

      <Text style={reportStyles.h1}>부모님께 드리는 제안</Text>
      <Text style={reportStyles.muted}>이번 주 {data.studentName}님과 나누시면 좋은 대화 주제예요</Text>

      <Text style={reportStyles.h2}>이번 달 대화 주제</Text>
      {data.conversations.map((c, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <Text style={reportStyles.listItemTitle}>
            {i + 1}. {c.topic}
          </Text>
          <Text style={reportStyles.listItemDetail}>— {c.why}</Text>
        </View>
      ))}

      <Text style={reportStyles.h2}>응원 메시지</Text>
      <View
        style={{
          backgroundColor: "#FFFBEB",
          borderRadius: 8,
          padding: 14,
          borderWidth: 1,
          borderColor: "#FEF3C7",
        }}
      >
        <Text style={{ fontSize: 10, lineHeight: 1.7, color: "#1F1B16" }}>
          {data.encouragement}
        </Text>
      </View>

      <View style={reportStyles.ctaBox}>
        <Text style={reportStyles.ctaTitle}>
          PRISM Elite 구독자는 매주 자동으로 받아보실 수 있어요
        </Text>
        <Text style={reportStyles.ctaDetail}>
          자녀의 GPA·SAT 변화, 합격 가능성, 우선순위를 매주 이 형식으로 정리해 보내드려요.
          구독은 언제든 해지 가능하며, 남은 기간까지는 계속 이용하실 수 있어요.
        </Text>
        <Text style={reportStyles.ctaLink}>prismedu.kr/pricing</Text>
      </View>

      <View style={reportStyles.footer}>
        <Text>PRISM · 본 리포트는 AI가 작성한 참고 자료입니다</Text>
        <Text>3 / 3</Text>
      </View>
    </View>
  );
}
