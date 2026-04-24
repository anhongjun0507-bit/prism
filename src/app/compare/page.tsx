"use client";

import { useState, useMemo, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useSchoolsIndex, schoolMatchesQuery } from "@/lib/schools-index";
import { SchoolLogo } from "@/components/SchoolLogo";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import type { UserProfile } from "@/lib/auth-context";

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
    // dashboard/analysis/onboarding/parent-report/what-if와 동일한 기본값.
    // 이전에 ecTier:1, intl:false로 어긋나 compare 페이지의 확률이 다른 페이지보다 과대/과소 표시됨.
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
  getValue: (s: School) => string;
  getRaw: (s: School) => number;
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
  const [selected, setSelected] = useState<School[]>([]);
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const specs = useMemo(() => buildSpecs(profile), [profile]);
  // Match 결과는 서버에서 가져옴 (specs 있을 때만). 없으면 인덱스만 표시.
  const [matchedSchools, setMatchedSchools] = useState<School[]>([]);
  useEffect(() => {
    if (!specs) {
      // specs 없으면 빈 매치 결과로, 학교 picker는 schoolsIndex로 채움 (아래 fallback)
      setMatchedSchools([]);
      return;
    }
    let cancelled = false;
    fetchWithAuth<{ results: School[] }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((d) => { if (!cancelled) setMatchedSchools(d.results || []); })
      .catch((e) => { if (!cancelled) showApiError(e, { title: "비교 데이터 불러오기 실패" }); });
    return () => { cancelled = true; };
  }, [specs, showApiError]);

  // specs 없을 때는 인덱스로 학교 picker만 채우기 (prob/cat 등은 빈 값)
  const effectiveSchools = useMemo<School[]>(() => {
    if (matchedSchools.length > 0) return matchedSchools;
    return schoolsIndex.map((s) => ({
      ...s,
      n: s.n, c: s.c, d: s.d, rk: s.rk,
      r: s.r ?? 0, sat: s.sat ?? [0, 0], gpa: s.gpa ?? 0,
      ea: s.ea, rd: s.rd ?? "", tg: s.tg ?? [], toefl: 0,
      tp: "", reqs: [], prompts: [], mr: {},
    } as School));
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

  function addSchool(school: School) {
    if (selected.length >= MAX_SCHOOLS) return;
    if (selectedNames.has(school.n)) return;
    setSelected([...selected, school]);
    setOpenSlot(null);
    setSearchQ("");
  }

  function removeSchool(name: string) {
    setSelected(selected.filter((s) => s.n !== name));
  }

  const rows: RowDef[] = useMemo(() => {
    const base: RowDef[] = [
      {
        label: "US News 순위",
        key: "rank",
        getValue: (s) => s.rk > 0 ? `#${s.rk}` : "Unranked",
        getRaw: (s) => s.rk > 0 ? s.rk : 9999,
        bestIs: "min",
      },
      {
        label: "합격률",
        key: "rate",
        getValue: (s) => `${s.r}%`,
        getRaw: (s) => s.r,
        bestIs: "max",
      },
      {
        label: "SAT 범위",
        key: "sat",
        getValue: (s) => (s.sat ? `${s.sat[0]}-${s.sat[1]}` : "-"),
        getRaw: (s) => (s.sat ? s.sat[1] : 0),
        bestIs: "max",
      },
      {
        label: "GPA 중앙값",
        key: "gpa",
        getValue: (s) => (s.gpa ? s.gpa.toFixed(2) : "-"),
        getRaw: (s) => s.gpa || 0,
        bestIs: "max",
      },
      {
        label: "등록금",
        key: "tuition",
        getValue: (s) => formatTuition(s.tuition),
        getRaw: (s) => s.tuition || 999999,
        bestIs: "min",
      },
      {
        label: "학교 규모",
        key: "size",
        getValue: (s) => formatSize(s.size),
        getRaw: (s) => s.size || 0,
        bestIs: "max",
      },
      {
        label: "위치",
        key: "loc",
        getValue: (s) => s.loc || "-",
        getRaw: () => 0,
        bestIs: "max",
      },
      {
        label: "환경",
        key: "setting",
        getValue: (s) => s.setting || "-",
        getRaw: () => 0,
        bestIs: "max",
      },
      {
        label: "TOEFL 최소",
        key: "toefl",
        getValue: (s) => (s.toefl ? `${s.toefl}` : "-"),
        getRaw: (s) => s.toefl || 999,
        bestIs: "min",
      },
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
    // Skip highlight for non-numeric rows
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
    // Check if all values are equal
    const allEqual = selected.every(
      (s) => row.getRaw(s) === row.getRaw(selected[0])
    );
    if (allEqual) return null;
    return bestIdx;
  }

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader title="대학 비교" backHref="/analysis" sticky />

      <div className="max-w-2xl mx-auto px-gutter py-6 space-y-6">
        {/* School selector slots */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            비교할 대학을 선택하세요 (최대 {MAX_SCHOOLS}개)
          </p>
          <div className="flex gap-3">
            {Array.from({ length: MAX_SCHOOLS }).map((_, idx) => {
              const school = selected[idx];
              if (school) {
                return (
                  <Card
                    key={school.n}
                    className="flex-1 p-3 flex flex-col items-center gap-2 relative"
                  >
                    <button
                      onClick={() => removeSchool(school.n)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <SchoolLogo
                      domain={school.d}
                      color={school.c}
                      name={school.n}
                      size="sm"
                    />
                    <p className="text-xs font-bold text-center leading-tight line-clamp-2">
                      {school.n}
                    </p>
                  </Card>
                );
              }
              return (
                <Card
                  key={`empty-${idx}`}
                  className="flex-1 p-3 flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[88px]"
                  onClick={() => {
                    setOpenSlot(idx);
                    setSearchQ("");
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">대학 추가</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Search dropdown */}
        {openSlot !== null && (
          <Card className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="대학 이름으로 검색..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-9 h-10 rounded-xl"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredSchools.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  >
                    <SchoolLogo
                      domain={s.d}
                      color={s.c}
                      name={s.n}
                      rank={s.rk}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.n}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.rk > 0 ? `#${s.rk}` : "Unranked"} &middot; {s.loc || ""}
                      </p>
                    </div>
                    {alreadySelected && (
                      <Badge variant="secondary" className="text-xs">
                        선택됨
                      </Badge>
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
              className="w-full text-xs"
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
                <Card key={row.key} className="p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {row.label}
                  </p>
                  <div className="space-y-1.5">
                    {selected.map((s, i) => (
                      <div
                        key={s.n}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${
                          bestIdx === i
                            ? "bg-emerald-50 dark:bg-emerald-950/30"
                            : ""
                        }`}
                        aria-label={bestIdx === i ? `${row.label} 최적 값` : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.c || "#6366f1" }}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium truncate" title={s.n}>
                            {s.n}
                          </span>
                        </div>
                        <span
                          className={`text-sm tabular-nums shrink-0 ${
                            bestIdx === i
                              ? "font-bold text-emerald-700 dark:text-emerald-300"
                              : "font-medium text-foreground"
                          }`}
                        >
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
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs text-muted-foreground p-3 w-24">
                      항목
                    </th>
                    {selected.map((s) => (
                      <th key={s.n} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <SchoolLogo
                            domain={s.d}
                            color={s.c}
                            name={s.n}
                            size="sm"
                          />
                          <p className="text-xs font-bold mt-2 leading-tight">
                            {s.n}
                          </p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const bestIdx = getBestIdx(row);
                    return (
                      <tr
                        key={row.key}
                        className="border-b border-border/30 last:border-none"
                      >
                        <td className="text-xs text-muted-foreground p-3 font-medium">
                          {row.label}
                        </td>
                        {selected.map((s, i) => (
                          <td
                            key={s.n}
                            className={`text-sm font-medium text-center p-3 tabular-nums ${
                              bestIdx === i
                                ? "text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/30"
                                : "text-foreground"
                            }`}
                            aria-label={bestIdx === i ? `${row.label} 최적 값` : undefined}
                          >
                            {row.getValue(s)}
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
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              비교하려면 대학을 하나 더 추가하세요
            </p>
          </div>
        )}

        {selected.length === 0 && (
          <EmptyState
            illustration="school"
            title="대학을 선택해 비교를 시작하세요"
            description="2~3개 대학의 정보를 나란히 비교할 수 있습니다"
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
