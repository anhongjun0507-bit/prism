"use client";

import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, FileText, PenLine } from "lucide-react";
import { COMMON_APP_PROMPTS, COMMON_APP_PROMPTS_KO } from "@/lib/constants";
import { SchoolLogo } from "@/components/SchoolLogo";
import type { SchoolIndex } from "@/lib/schools-index";

type SchoolDetail = {
  n: string; c: string; rk: number; d: string;
  prompts: string[]; tg: string[]; tp: string; reqs: string[];
};

export interface EssayPickerProps {
  selectedSchool: string | null;
  selectedSchoolData: SchoolDetail | null;
  searchQuery: string;
  filteredSchools: SchoolIndex[];
  onBack: () => void;
  onSetSearchQuery: (q: string) => void;
  onSelectSchool: (name: string) => void;
  onOpenGeneralDialog: () => void;
  onCreateFromPrompt: (university: string, prompt: string) => void;
}

export function EssayPicker({
  selectedSchool,
  selectedSchoolData,
  searchQuery,
  filteredSchools,
  onBack,
  onSetSearchQuery,
  onSelectSchool,
  onOpenGeneralDialog,
  onCreateFromPrompt,
}: EssayPickerProps) {
  return (
    <div className="min-h-dvh bg-background pb-24">
      <PageHeader
        title={selectedSchool || "대학 선택"}
        onBack={onBack}
      />
      {!selectedSchool && (
        <div className="px-gutter-sm md:px-gutter pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="대학 이름 검색..."
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
        </div>
      )}

      <div className="px-gutter-sm md:px-gutter space-y-2">
        {!selectedSchool ? (
          <>
            <Card
              variant="elevated"
              interactive
              className="hover:bg-accent/30 transition-colors"
              onClick={() => onSelectSchool("Common App")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Common App 에세이</p>
                  <p className="text-xs text-muted-foreground">{COMMON_APP_PROMPTS.length}개 프롬프트</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card
              variant="elevated"
              interactive
              className="hover:bg-accent/30 transition-colors"
              onClick={onOpenGeneralDialog}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">일반 에세이</p>
                  <p className="text-xs text-muted-foreground">연습용·자유 주제·활동 일지 등 자유 형식</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">대학별 supplemental</p>
            </div>

            {filteredSchools.map((school) => (
              <Card
                key={school.n}
                variant="elevated"
              interactive
              className="hover:bg-accent/30 transition-colors"
                onClick={() => onSelectSchool(school.n)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{school.n}</p>
                    <p className="text-xs text-muted-foreground">{school.loc || ""}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              프롬프트를 선택하면 에세이 작성을 시작합니다.
            </p>
            {(selectedSchool === "Common App"
              ? COMMON_APP_PROMPTS
              : selectedSchoolData?.prompts || []
            ).map((prompt: string, i: number) => (
              <Card
                key={i}
                variant="elevated"
              interactive
              className="hover:bg-accent/30 transition-colors"
                onClick={() => onCreateFromPrompt(selectedSchool, prompt)}
              >
                <CardContent className="p-4 space-y-1.5">
                  <p className="text-sm leading-relaxed">{prompt}</p>
                  {selectedSchool === "Common App" && COMMON_APP_PROMPTS_KO[i] && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{COMMON_APP_PROMPTS_KO[i]}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {selectedSchool !== "Common App" && selectedSchoolData && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                <p className="text-xs font-semibold text-primary mb-1">학교 팁</p>
                <p className="text-xs text-muted-foreground">{selectedSchoolData.tp}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSchoolData.reqs?.map((r: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
