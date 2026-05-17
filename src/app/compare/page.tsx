"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Search, X, Plus, GraduationCap, Sparkles, Heart, ChevronLeft, School } from "lucide-react";
import { PageIntroCard } from "@/components/PageIntroCard";
import { useSchoolsIndex, schoolMatchesQuery } from "@/lib/schools-index";
import { SchoolLogo } from "@/components/SchoolLogo";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import type { Specs, School as SchoolModel } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import type { UserProfile } from "@/lib/auth-context";
// v3 design system
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Badge } from "@/components/ui-v2/badge";
import { EmptyState } from "@/components/ui-v2/empty-state";

const MAX_SCHOOLS = 3;

function buildSpecs(profile: UserProfile | null): Specs | null {
  if (!profile?.gpa && !profile?.sat) return null;
  return {
    gpaUW: profile.gpa || "",
    gpaW: "",
    sat: profile.sat || "",
    act: "",
    toefl: profile.toefl || "",
    ielts: "",
    apCount: "",
    apAvg: "",
    satSubj: "",
    classRank: "",
    ecTier: 2,
    awardTier: 2,
    essayQ: 3,
    recQ: 3,
    interviewQ: 3,
    legacy: false,
    firstGen: false,
    earlyApp: "",
    needAid: false,
    gender: "",
    intl: true,
    major: profile.major || "Computer Science",
  };
}

type RowDef = {
  label: string;
  key: string;
  getValue: (s: SchoolModel) => string;
  getRaw: (s: SchoolModel) => number;
  bestIs: "min" | "max";
};

function formatTuition(t?: number) {
  if (!t) return "-";
  return `$${(t / 1000).toFixed(0)}k`;
}

function formatSize(s?: number) {
  if (!s) return "-";
  if (s >= 10000) return `${(s / 1000).toFixed(1)}k명`;
  return `${s.toLocaleString()}명`;
}

export default function ComparePage() {
  return <AuthRequired><ComparePageInner /></AuthRequired>;
}

function ComparePageInner() {
  const { profile } = useAuth();
  const showApiError = useApiErrorToast();
  const schoolsIndex = useSchoolsIndex();
  const [selected, setSelected] = useState<SchoolModel[]>([]);
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const specs = useMemo(() => buildSpecs(profile), [profile]);
  const [matchedSchools, setMatchedSchools] = useState<SchoolModel[]>([]);
  useEffect(() => {
    if (!specs) {
      setMatchedSchools([]);
      return;
    }
    let cancelled = false;
    fetchWithAuth<{ results: SchoolModel[] }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((d) => { if (!cancelled) setMatchedSchools(d.results || []); })
      .catch((e) => { if (!cancelled) showApiError(e, { title: "비교 데이터 불러오기 실패" }); });
    return () => { cancelled = true; };
  }, [specs, showApiError]);

  const effectiveSchools = useMemo<SchoolModel[]>(() => {
    if (matchedSchools.length > 0) return matchedSchools;
    return schoolsIndex.map((s) => ({
      ...s,
      n: s.n, c: s.c, d: s.d, rk: s.rk,
      r: s.r ?? 0, sat: s.sat ?? [0, 0], gpa: s.gpa ?? 0,
      ea: s.ea, rd: s.rd ?? "", tg: s.tg ?? [], toefl: 0,
      tp: "", reqs: [], prompts: [], mr: {},
    } as SchoolModel));
  }, [matchedSchools, schoolsIndex]);

  const filteredSchools = useMemo(() => {
    if (!searchQ.trim()) return effectiveSchools.slice(0, 10);
    const q = searchQ.toLowerCase();
    return effectiveSchools
      .filter(
        (s) =>
          schoolMatchesQuery(s, searchQ) ||
          (s.loc && s.loc.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [searchQ, effectiveSchools]);

  const selectedNames = new Set(selected.map((s) => s.n));

  function addSchool(school: SchoolModel) {
    if (selected.length >= MAX_SCHOOLS) return;
    if (selectedNames.has(school.n)) return;
    setSelected([...selected, school]);
    setOpenSlot(null);
    setSearchQ("");
  }

  function removeSchool(name: string) {
    setSelected(selected.filter((s) => s.n !== name));
  }

  const recommendedTrio = useMemo<SchoolModel[] | null>(() => {
    if (matchedSchools.length === 0) return null;
    const pickHighestProb = (cat: string) =>
      matchedSchools.filter((s) => s.cat === cat).sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0))[0];
    const reach = pickHighestProb("Reach");
    const target = pickHighestProb("Target");
    const safety = pickHighestProb("Safety");
    const trio = [reach, target, safety].filter((s): s is SchoolModel => !!s);
    if (trio.length < 2) return null;
    return trio;
  }, [matchedSchools]);

  function applyRecommendedTrio() {
    if (!recommendedTrio) return;
    setSelected(recommendedTrio.slice(0, MAX_SCHOOLS));
    setOpenSlot(null);
    setSearchQ("");
  }

  const favoriteSchools = useMemo<SchoolModel[]>(() => {
    const favNames = profile?.favoriteSchools || [];
    if (favNames.length === 0) return [];
    const byName = new Map(effectiveSchools.map((s) => [s.n, s]));
    return favNames
      .map((n) => byName.get(n))
      .filter((s): s is SchoolModel => !!s)
      .filter((s) => !selectedNames.has(s.n))
      .slice(0, 5);
  }, [profile?.favoriteSchools, effectiveSchools, selectedNames]);

  const rows: RowDef[] = useMemo(() => {
    const base: RowDef[] = [
      { label: "US News 순위", key: "rank", getValue: (s) => s.rk > 0 ? `#${s.rk}` : "Unranked", getRaw: (s) => s.rk > 0 ? s.rk : 9999, bestIs: "min" },
      { label: "합격률", key: "rate", getValue: (s) => `${s.r}%`, getRaw: (s) => s.r, bestIs: "max" },
      { label: "SAT 범위", key: "sat", getValue: (s) => (s.sat ? `${s.sat[0]}-${s.sat[1]}` : "-"), getRaw: (s) => (s.sat ? s.sat[1] : 0), bestIs: "max" },
      { label: "GPA 중앙값", key: "gpa", getValue: (s) => (s.gpa ? s.gpa.toFixed(2) : "-"), getRaw: (s) => s.gpa || 0, bestIs: "max" },
      { label: "등록금", key: "tuition", getValue: (s) => formatTuition(s.tuition), getRaw: (s) => s.tuition || 999999, bestIs: "min" },
      { label: "학교 규모", key: "size", getValue: (s) => formatSize(s.size), getRaw: (s) => s.size || 0, bestIs: "max" },
      { label: "위치", key: "loc", getValue: (s) => s.loc || "-", getRaw: () => 0, bestIs: "max" },
      { label: "환경", key: "setting", getValue: (s) => s.setting || "-", getRaw: () => 0, bestIs: "max" },
      { label: "TOEFL 최소", key: "toefl", getValue: (s) => (s.toefl ? `${s.toefl}` : "-"), getRaw: (s) => s.toefl || 999, bestIs: "min" },
    ];

    if (specs) {
      base.push({
        label: "합격 확률",
        key: "prob",
        getValue: (s) => (s.prob != null ? `${s.prob}%` : "-"),
        getRaw: (s) => s.prob ?? 0,
        bestIs: "max",
      });
    }

    return base;
  }, [specs]);

  function getBestIdx(row: RowDef): number | null {
    if (selected.length < 2) return null;
    if (row.key === "loc" || row.key === "setting") return null;

    let bestIdx = 0;
    let bestVal = row.getRaw(selected[0]);
    for (let i = 1; i < selected.length; i++) {
      const val = row.getRaw(selected[i]);
      if (row.bestIs === "min" ? val < bestVal : val > bestVal) {
        bestIdx = i;
        bestVal = val;
      }
    }
    const allEqual = selected.every(
      (s) => row.getRaw(s) === row.getRaw(selected[0])
    );
    if (allEqual) return null;
    return bestIdx;
  }

  return (
    <div
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1120px]">
        <PageHeader
          title="대학 비교"
          subtitle="최대 3개교를 나란히 비교"
          eyebrow={
            <Link
              href="/analysis"
              className="inline-flex items-center gap-1 text-ds-body-sm hover:underline underline-offset-2"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              분석
            </Link>
          }
        />

        <div className="space-y-6">
          <PageIntroCard
            toolId="compare"
            title="대학 비교란?"
            description="최대 3개 대학교를 한 화면에서 합격률·학비·전공 강점 등 주요 지표로 비교해드려요."
            bullets={[
              "각 행에서 가장 유리한 대학을 자동 하이라이트",
              "ED·EA·RD 지원 전략 결정 시 활용",
            ]}
          />

          <div className="space-y-3">
            <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">
              비교할 대학을 선택하세요 (최대 {MAX_SCHOOLS}개)
            </p>
            <div className="flex gap-3">
              {Array.from({ length: MAX_SCHOOLS }).map((_, idx) => {
                const school = selected[idx];
                if (school) {
                  return (
                    <Card
                      key={school.n}
                      padding="none"
                      className="flex-1 p-3 flex flex-col items-center gap-2 relative"
                    >
                      <button
                        onClick={() => removeSchool(school.n)}
                        className="absolute top-1.5 right-1.5 size-5 rounded-ds-pill flex items-center justify-center"
                        style={{ background: "var(--ds-bg-subtle)" }}
                        aria-label={`${school.n} 제거`}
                      >
                        <X
                          className="size-3"
                          style={{ color: "var(--ds-text-secondary)" }}
                        />
                      </button>
                      <SchoolLogo
                        domain={school.d}
                        color={school.c}
                        name={school.n}
                        size="sm"
                      />
                      <p className="text-ds-body-sm font-bold text-center leading-tight line-clamp-2 text-[color:var(--ds-text-primary)]">
                        {school.n}
                      </p>
                    </Card>
                  );
                }
                return (
                  <button
                    key={`empty-${idx}`}
                    type="button"
                    onClick={() => {
                      setOpenSlot(idx);
                      setSearchQ("");
                    }}
                    className="flex-1 p-3 flex flex-col items-center justify-center gap-2 min-h-[96px] rounded-ds-card transition-colors"
                    style={{
                      border: "1px dashed var(--ds-border-default)",
                      background: "transparent",
                    }}
                  >
                    <div
                      className="size-8 rounded-ds-pill flex items-center justify-center"
                      style={{ background: "var(--ds-bg-subtle)" }}
                    >
                      <Plus
                        className="size-4"
                        style={{ color: "var(--ds-text-tertiary)" }}
                      />
                    </div>
                    <p
                      className="text-ds-body-sm"
                      style={{ color: "var(--ds-text-tertiary)" }}
                    >
                      대학 추가
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {openSlot !== null && (
            <Card className="space-y-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: "var(--ds-text-tertiary)" }}
                  aria-hidden="true"
                />
                <Input
                  placeholder="대학 이름으로 검색..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {!searchQ.trim() && recommendedTrio && selected.length === 0 && (
                <button
                  type="button"
                  onClick={applyRecommendedTrio}
                  className="w-full flex items-center gap-3 p-3 rounded-ds-input transition-colors text-left"
                  style={{
                    background: "var(--ds-brand-primary-soft)",
                    border: "1px solid var(--ds-brand-primary)",
                  }}
                >
                  <div
                    className="size-8 rounded-ds-pill flex items-center justify-center shrink-0"
                    style={{ background: "var(--ds-bg-surface)" }}
                  >
                    <Sparkles
                      className="size-4"
                      style={{ color: "var(--ds-brand-primary)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ds-body-sm font-semibold text-[color:var(--ds-text-primary)]">
                      추천 조합 한 번에 채우기
                    </p>
                    <p
                      className="text-ds-body-sm truncate"
                      style={{ color: "var(--ds-text-secondary)" }}
                    >
                      {recommendedTrio.map((s) => s.n).join(" · ")}
                    </p>
                  </div>
                </button>
              )}

              {!searchQ.trim() && favoriteSchools.length > 0 && (
                <div className="space-y-1.5">
                  <p
                    className="text-ds-body-sm font-semibold flex items-center gap-1.5"
                    style={{ color: "var(--ds-text-secondary)" }}
                  >
                    <Heart className="size-3" /> 즐겨찾기에서 추가
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteSchools.map((s) => (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => addSchool(s)}
                        className="px-3 h-8 rounded-ds-pill text-ds-body-sm font-medium flex items-center gap-1.5 max-w-[200px] transition-colors"
                        style={{
                          background: "var(--ds-bg-surface)",
                          border: "1px solid var(--ds-border-subtle)",
                          color: "var(--ds-text-primary)",
                        }}
                      >
                        <span className="truncate">{s.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredSchools.length === 0 && (
                  <p
                    className="text-ds-body-sm text-center py-4"
                    style={{ color: "var(--ds-text-tertiary)" }}
                  >
                    검색 결과가 없습니다
                  </p>
                )}
                {filteredSchools.map((s) => {
                  const alreadySelected = selectedNames.has(s.n);
                  return (
                    <button
                      key={s.n}
                      disabled={alreadySelected}
                      onClick={() => addSchool(s)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-ds-input transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[color:var(--ds-bg-subtle)]"
                    >
                      <SchoolLogo
                        domain={s.d}
                        color={s.c}
                        name={s.n}
                        rank={s.rk}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-ds-body-sm font-semibold truncate text-[color:var(--ds-text-primary)]">
                          {s.n}
                        </p>
                        <p
                          className="text-ds-body-sm"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          {s.rk > 0 ? `#${s.rk}` : "Unranked"} · {s.loc || ""}
                        </p>
                      </div>
                      {alreadySelected && (
                        <Badge variant="neutral">선택됨</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpenSlot(null);
                  setSearchQ("");
                }}
                className="w-full"
              >
                닫기
              </Button>
            </Card>
          )}

          {/* Comparison — mobile card layout */}
          {selected.length >= 2 && (
            <div className="space-y-4 md:hidden">
              {rows.map((row) => {
                const bestIdx = getBestIdx(row);
                return (
                  <Card key={row.key} className="space-y-2.5">
                    <p
                      className="text-ds-body-sm font-semibold"
                      style={{ color: "var(--ds-text-secondary)" }}
                    >
                      {row.label}
                    </p>
                    <div className="space-y-1.5">
                      {selected.map((s, i) => (
                        <div
                          key={s.n}
                          className="flex items-center justify-between gap-3 rounded-ds-input px-2.5 py-2"
                          style={
                            bestIdx === i
                              ? { background: "var(--ds-brand-primary-soft)" }
                              : undefined
                          }
                          aria-label={bestIdx === i ? `${row.label} 최적 값` : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="size-2 rounded-ds-pill shrink-0"
                              style={{ backgroundColor: s.c || "var(--ds-brand-primary)" }}
                              aria-hidden="true"
                            />
                            <span
                              className="text-ds-body-sm font-medium truncate text-[color:var(--ds-text-primary)]"
                              title={s.n}
                            >
                              {s.n}
                            </span>
                          </div>
                          <span
                            className="text-ds-body-sm tabular-nums shrink-0 inline-flex items-center gap-1.5"
                            style={{
                              fontWeight: bestIdx === i ? 700 : 500,
                              color:
                                bestIdx === i
                                  ? "var(--ds-brand-primary)"
                                  : "var(--ds-text-primary)",
                            }}
                          >
                            {bestIdx === i && (
                              <span
                                className="size-1.5 rounded-ds-pill"
                                style={{ background: "var(--ds-brand-primary)" }}
                                aria-hidden="true"
                              />
                            )}
                            {row.getValue(s)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Comparison — desktop table */}
          {selected.length >= 2 && (
            <Card padding="none" className="overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid var(--ds-border-subtle)" }}
                    >
                      <th
                        className="text-left text-ds-body-sm p-4 w-28"
                        style={{ color: "var(--ds-text-tertiary)" }}
                      >
                        항목
                      </th>
                      {selected.map((s) => (
                        <th key={s.n} className="p-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <SchoolLogo
                              domain={s.d}
                              color={s.c}
                              name={s.n}
                              size="sm"
                            />
                            <p className="text-ds-body-sm font-bold leading-tight text-[color:var(--ds-text-primary)]">
                              {s.n}
                            </p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const bestIdx = getBestIdx(row);
                      return (
                        <tr
                          key={row.key}
                          style={
                            ri === rows.length - 1
                              ? undefined
                              : { borderBottom: "1px solid var(--ds-border-subtle)" }
                          }
                        >
                          <td
                            className="text-ds-body-sm p-4 font-medium"
                            style={{ color: "var(--ds-text-secondary)" }}
                          >
                            {row.label}
                          </td>
                          {selected.map((s, i) => (
                            <td
                              key={s.n}
                              className="text-ds-body-sm font-medium text-center p-4 tabular-nums"
                              style={
                                bestIdx === i
                                  ? {
                                      color: "var(--ds-brand-primary)",
                                      fontWeight: 700,
                                      background: "var(--ds-brand-primary-soft)",
                                    }
                                  : { color: "var(--ds-text-primary)" }
                              }
                              aria-label={bestIdx === i ? `${row.label} 최적 값` : undefined}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {bestIdx === i && (
                                  <span
                                    className="size-1.5 rounded-ds-pill"
                                    style={{ background: "var(--ds-brand-primary)" }}
                                    aria-hidden="true"
                                  />
                                )}
                                {row.getValue(s)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {selected.length < 2 && selected.length > 0 && (
            <div className="text-center py-8">
              <GraduationCap
                className="size-10 mx-auto mb-3"
                style={{ color: "var(--ds-text-tertiary)" }}
              />
              <p
                className="text-ds-body-sm"
                style={{ color: "var(--ds-text-tertiary)" }}
              >
                비교하려면 대학을 하나 더 추가하세요
              </p>
            </div>
          )}

          {selected.length === 0 && (
            <Card>
              <EmptyState
                tone="brand"
                illustration={<School />}
                title="대학을 선택해 비교를 시작하세요"
                description="2~3개 대학의 정보를 나란히 비교할 수 있어요"
              />
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
