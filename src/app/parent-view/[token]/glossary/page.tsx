/**
 * /parent-view/[token]/glossary — 미국 입시 영어 약어 사전.
 * 학생 정보가 필요 없어 buildParentReportData 호출 생략 (토큰 검증만).
 */
import type { Metadata } from "next";
import { validateParentToken, bumpParentTokenView } from "@/lib/parent/validate-token";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentNav } from "@/components/parent/ParentNav";

export const metadata: Metadata = {
  title: "입시 용어 사전 | PRISM 학부모",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface Term {
  term: string;
  korean: string;
  body: string;
  koreanCompare?: string;
}

const TERMS: Term[] = [
  {
    term: "GPA",
    korean: "내신 평점",
    body: "고등학교 4년간 받은 학기 성적의 평균. 4.0 만점 또는 5.0 만점.",
    koreanCompare: "한국 내신 등급과 비슷하지만, 1–9등급이 아니라 점수예요.",
  },
  {
    term: "SAT",
    korean: "미국 표준 시험",
    body: "1600점 만점, 영어(읽기·쓰기) + 수학. 보통 2–3회 응시해 가장 높은 점수를 제출.",
    koreanCompare: "한국 수능과 비슷한 역할이지만, 여러 번 볼 수 있어요.",
  },
  {
    term: "TOEFL / IELTS",
    korean: "영어 시험",
    body: "미국 대학이 영어가 모국어 아닌 학생에게 요구하는 시험. TOEFL은 120점, IELTS는 9.0 만점.",
    koreanCompare: "한국 학생은 보통 TOEFL 100점 이상이 안전권.",
  },
  {
    term: "ED (Early Decision)",
    korean: "조기 결정",
    body: "11월 초 마감, 12월 중순 결과. 합격 시 반드시 등록해야 하는 구속력 있는 지원.",
    koreanCompare: "한국 수시 학종처럼 11–12월에 결과가 나와요.",
  },
  {
    term: "EA (Early Action)",
    korean: "조기 지원",
    body: "ED와 비슷하지만 합격해도 등록 의무가 없어요. 11월 마감, 12월 결과.",
  },
  {
    term: "RD (Regular Decision)",
    korean: "정시",
    body: "1월 초 마감, 3월 중순–하순 결과. 미국 입시의 가장 일반적 방식.",
    koreanCompare: "한국 정시와 비슷한 시기예요.",
  },
  {
    term: "Common App",
    korean: "공통 지원서",
    body: "1,000개 이상의 미국 대학에 동시에 사용하는 표준 지원서. 학생 정보·에세이 한 번 작성.",
  },
  {
    term: "Reach / Target / Safety",
    korean: "도전 / 적정 / 안정 학교",
    body: "합격 가능성에 따른 분류. Reach=어려움, Target=가능성 있음, Safety=안전권.",
    koreanCompare: "한국 입시의 '상향·소신·안정'과 같은 개념.",
  },
  {
    term: "Holistic Review",
    korean: "종합 평가",
    body: "성적·시험뿐 아니라 에세이·활동·추천서·면접까지 모두 평가하는 미국 입시 방식.",
    koreanCompare: "한국 학종(학생부종합전형)과 비슷한 철학이에요.",
  },
  {
    term: "Yield",
    korean: "등록률",
    body: "합격자 중 실제로 등록한 학생 비율. 높을수록 학생들에게 인기 있는 학교.",
  },
  {
    term: "AP (Advanced Placement)",
    korean: "대학 인정 과목",
    body: "고등학교에서 듣는 대학 수준 과목. 5점 만점 시험에서 4–5점이면 대학 학점으로 인정 가능.",
  },
  {
    term: "Supplemental Essay",
    korean: "대학별 추가 에세이",
    body: "Common App 외에 각 대학교가 추가로 요구하는 짧은 에세이들. 학교당 1–5개.",
  },
];

export default async function ParentGlossaryPage({ params }: PageProps) {
  const { token } = await params;
  const result = await validateParentToken(token);
  if ("reason" in result) return <InvalidTokenView reason={result.reason} />;
  bumpParentTokenView(token);

  return (
    <main className="parent-track min-h-screen bg-background pb-12">
      <ParentNav token={token} active="glossary" />

      <header className="px-6 py-8 border-b border-border/60">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-sm font-semibold text-primary">입시 용어 사전</p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            모르는 영어 약어, 한국어로 풀어드려요
          </h1>
          <p className="text-foreground/80 leading-relaxed">
            자녀가 자주 쓰는 입시 용어를 모았어요. 한국 입시와 비교해 이해하기 쉽게 설명해요.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {TERMS.map((t) => (
          <article
            key={t.term}
            className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-2"
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="font-headline text-xl font-bold text-foreground">{t.term}</h2>
              <p className="text-base font-semibold text-primary">{t.korean}</p>
            </div>
            <p className="text-foreground/85 leading-relaxed">{t.body}</p>
            {t.koreanCompare && (
              <p className="text-sm text-foreground/70 bg-muted/40 rounded-xl px-3 py-2 mt-2">
                💡 {t.koreanCompare}
              </p>
            )}
          </article>
        ))}

        <p className="text-xs text-muted-foreground/70 text-center pt-4">
          더 궁금한 용어가 있으시면 자녀에게 물어봐주세요. PRISM 앱 안에서 더 많은 용어 설명이 있어요.
        </p>
      </div>
    </main>
  );
}
