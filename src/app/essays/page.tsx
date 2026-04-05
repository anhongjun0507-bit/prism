
"use client";

import { useState, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, FileText, ArrowLeft, Search, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SCHOOLS } from "@/lib/school";
import { COMMON_APP_PROMPTS } from "@/lib/constants";

interface Essay {
  id: string;
  university: string;
  prompt: string;
  content: string;
  lastSaved: string;
  wordLimit?: number;
}

function getSchoolList() {
  return SCHOOLS as Array<{ n: string; c: string; rk: number; prompts: string[]; tg: string[]; tp: string; reqs: string[] }>;
}

export default function EssaysPage() {
  const { toast } = useToast();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [activeEssay, setActiveEssay] = useState<Essay | null>(null);
  const [view, setView] = useState<"list" | "editor" | "picker">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  const schools = useMemo(() => getSchoolList(), []);

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools.slice(0, 20);
    return schools
      .filter((s: { n: string }) => s.n.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [searchQuery, schools]);

  const selectedSchoolData = useMemo(
    () => schools.find((s: { n: string }) => s.n === selectedSchool),
    [selectedSchool, schools]
  );

  const wordCount = activeEssay?.content.split(/\s+/).filter(Boolean).length || 0;
  const charCount = activeEssay?.content.length || 0;

  const handleSave = () => {
    if (!activeEssay) return;
    const updated = { ...activeEssay, lastSaved: new Date().toISOString().split("T")[0] };
    setEssays((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    toast({
      title: "저장 완료",
      description: `${activeEssay.university} 에세이가 저장되었습니다.`,
    });
  };

  const handleCreateFromPrompt = (university: string, prompt: string) => {
    const limitMatch = prompt.match(/(\d+)자/);
    const newEssay: Essay = {
      id: Date.now().toString(),
      university,
      prompt,
      content: "",
      lastSaved: new Date().toISOString().split("T")[0],
      wordLimit: limitMatch ? parseInt(limitMatch[1]) : undefined,
    };
    setEssays((prev) => [newEssay, ...prev]);
    setActiveEssay(newEssay);
    setView("editor");
    setSelectedSchool(null);
  };

  // Editor View
  if (view === "editor" && activeEssay) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSave();
                setActiveEssay(null);
                setView("list");
              }}
              className="text-primary -ml-2 gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> 목록
            </Button>
            <Button onClick={handleSave} size="sm" className="gap-1.5 rounded-xl">
              <Save className="w-3.5 h-3.5" /> 저장
            </Button>
          </div>
        </header>

        <div className="px-6 space-y-4">
          <div>
            <h2 className="font-headline text-xl font-bold">{activeEssay.university}</h2>
            <div className="mt-2 bg-primary/5 rounded-xl p-3 border border-primary/10">
              <p className="text-xs text-muted-foreground font-semibold mb-1">프롬프트</p>
              <p className="text-sm leading-relaxed">{activeEssay.prompt}</p>
            </div>
          </div>

          <div className="relative">
            <Textarea
              value={activeEssay.content}
              onChange={(e) => setActiveEssay({ ...activeEssay, content: e.target.value })}
              placeholder="여기에 에세이를 작성하세요..."
              className="min-h-[420px] rounded-2xl p-5 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20 bg-white"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Badge variant="secondary" className="px-2.5 py-1 text-[10px]">
                {wordCount} 단어
              </Badge>
              <Badge variant="secondary" className="px-2.5 py-1 text-[10px]">
                {charCount}자
                {activeEssay.wordLimit && (
                  <span className={charCount > activeEssay.wordLimit ? " text-red-500" : ""}>
                    /{activeEssay.wordLimit}
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // School Picker View
  if (view === "picker") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setView("list");
              setSelectedSchool(null);
              setSearchQuery("");
            }}
            className="text-primary -ml-2 gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </Button>

          {!selectedSchool ? (
            <>
              <h1 className="font-headline text-2xl font-bold">대학 선택</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="대학 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </>
          ) : (
            <h1 className="font-headline text-2xl font-bold">{selectedSchool}</h1>
          )}
        </header>

        <div className="px-6 space-y-2">
          {!selectedSchool ? (
            <>
              {/* Common App Prompts */}
              <Card
                className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setSelectedSchool("Common App")}
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

              {/* School List */}
              {filteredSchools.map((school: { n: string; c: string; rk: number; prompts: string[] }) => (
                <Card
                  key={school.n}
                  className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setSelectedSchool(school.n)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: school.c }}
                    >
                      #{school.rk}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{school.n}</p>
                      <p className="text-xs text-muted-foreground">{school.prompts?.length || 0}개 프롬프트</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            // Show prompts for selected school
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
                  className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => handleCreateFromPrompt(selectedSchool, prompt)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{prompt}</p>
                  </CardContent>
                </Card>
              ))}

              {selectedSchool !== "Common App" && selectedSchoolData && (
                <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                  <p className="text-xs font-semibold text-primary mb-1">학교 팁</p>
                  <p className="text-xs text-muted-foreground">{selectedSchoolData.tp}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedSchoolData.reqs?.map((r: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
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

  // List View
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold">에세이 관리</h1>
          <p className="text-sm text-muted-foreground">대학별 프롬프트로 에세이를 작성하세요.</p>
        </div>
        <Button onClick={() => setView("picker")} size="icon" className="rounded-full w-12 h-12 shadow-lg">
          <Plus />
        </Button>
      </header>

      <div className="px-6 space-y-3">
        {essays.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              아직 작성된 에세이가 없습니다.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              + 버튼을 눌러 대학별 프롬프트를 선택하세요.
            </p>
          </div>
        ) : (
          essays.map((essay) => (
            <Card
              key={essay.id}
              className="bg-white border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setActiveEssay(essay);
                setView("editor");
              }}
            >
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm">{essay.university}</h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {essay.content.split(/\s+/).filter(Boolean).length} 단어
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{essay.prompt}</p>
                {essay.content && (
                  <p className="text-xs text-foreground/60 line-clamp-1 italic">{essay.content}</p>
                )}
                <p className="text-[10px] text-primary font-medium">최종 수정: {essay.lastSaved}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
