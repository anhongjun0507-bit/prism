
"use client";

import { useState, useRef, useEffect } from "react";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "@/components/BottomNav";
import { fetchWithAuth } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Bot, User, RotateCcw, GraduationCap, PenLine, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/EmptyState";
import { PLANS } from "@/lib/plans";
import { ChatLimitModal } from "@/components/UpgradeCTA";
import { readJSON, writeJSON, removeKey } from "@/lib/storage";
import { ApiError } from "@/lib/api-client";

interface Message {
  role: "user" | "ai";
  content: string;
  error?: boolean;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

type SuggestedCategory = "지원준비" | "에세이" | "시험" | "활동";

const SUGGESTION_STYLES: Record<SuggestedCategory, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  iconColor: string;
  accent: string;
  label: string;
}> = {
  "지원준비": {
    icon: GraduationCap,
    gradient: "from-blue-500/5 to-transparent dark:from-blue-500/10",
    iconBg: "bg-blue-500/15 dark:bg-blue-500/25",
    iconColor: "text-blue-600 dark:text-blue-400",
    accent: "border-border hover:border-blue-500/40",
    label: "지원 준비",
  },
  "에세이": {
    icon: PenLine,
    gradient: "from-purple-500/5 to-transparent dark:from-purple-500/10",
    iconBg: "bg-purple-500/15 dark:bg-purple-500/25",
    iconColor: "text-purple-600 dark:text-purple-400",
    accent: "border-border hover:border-purple-500/40",
    label: "에세이",
  },
  "시험": {
    icon: TrendingUp,
    gradient: "from-emerald-500/5 to-transparent dark:from-emerald-500/10",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accent: "border-border hover:border-emerald-500/40",
    label: "시험 점수",
  },
  "활동": {
    icon: Trophy,
    gradient: "from-amber-500/5 to-transparent dark:from-amber-500/10",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
    accent: "border-border hover:border-amber-500/40",
    label: "과외활동",
  },
};

function highlightProfile(text: string): React.ReactNode {
  // 프로필 키워드는 HighlightedGreeting 내부에서 useAuth로 동적 수집.
  return <HighlightedGreeting text={text} />;
}

function HighlightedGreeting({ text }: { text: string }) {
  const { profile } = useAuth();
  const keywords = [profile?.name, profile?.dreamSchool, profile?.major].filter(Boolean) as string[];
  if (keywords.length === 0) return <>{text}</>;
  const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        keywords.includes(part)
          ? <span key={i} className="text-primary font-bold">{part}</span>
          : part
      )}
    </>
  );
}

export default function ChatPage() {
  const { profile, saveProfile, isMaster } = useAuth();
  const currentPlan = profile?.plan || "free";
  const dailyLimit = isMaster ? Infinity : PLANS[currentPlan].limits.aiChatPerDay;

  function getGreeting(): string {
    const name = profile?.name;
    const school = profile?.dreamSchool;
    const major = profile?.major;
    const gpa = profile?.gpa;
    const sat = profile?.sat;

    if (name && school && gpa) {
      return `${name}님, 안녕하세요! ${school} ${major || ""} 지원을 준비하고 계시군요. GPA ${gpa}${sat ? `, SAT ${sat}` : ""} 기준으로 어떤 부분을 더 준비하면 좋을지 함께 이야기해볼까요?`;
    }
    if (name && school) {
      return `${name}님, 안녕하세요! ${school} 지원을 꿈꾸고 계시군요. 궁금한 점이 있으시면 무엇이든 물어보세요!`;
    }
    if (name) {
      return `${name}님, 안녕하세요! 저는 PRISM의 AI 입시 카운슬러예요. 미국 대학 입시와 관련해 무엇이든 물어보세요.`;
    }
    return "안녕하세요! 저는 PRISM의 AI 입시 카운슬러예요. 미국 대학 입시와 관련해 궁금한 점이 있으시면 무엇이든 물어보세요.";
  }

  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: getGreeting() }
  ]);
  const CHAT_KEY = "prism_chat_history";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readJSON<Message[]>(CHAT_KEY);
    if (saved && saved.length > 0) setMessages(saved);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      writeJSON(CHAT_KEY, messages.slice(-50));
    }
  }, [messages]);

  const todayKey = getTodayKey();
  const chatCount = profile?.aiChatDate === todayKey ? (profile?.aiChatCount || 0) : 0;
  const remaining = dailyLimit === Infinity ? Infinity : dailyLimit - chatCount;
  const limitRatio = dailyLimit === Infinity ? 1 : Math.max(0, remaining / dailyLimit);
  const limitTone =
    dailyLimit === Infinity ? "primary" :
    remaining <= 0 ? "red" :
    remaining <= 1 ? "red" :
    remaining <= 2 ? "amber" :
    "primary";

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function buildStudentContext(): string {
    if (!profile) return "";
    const parts: string[] = [];
    if (profile.name) parts.push(`학생 이름: ${profile.name}`);
    if (profile.grade) parts.push(`학년: ${profile.grade}`);
    if (profile.dreamSchool) parts.push(`목표 대학교: ${profile.dreamSchool}`);
    if (profile.major) parts.push(`지망 전공: ${profile.major}`);
    if (profile.gpa) parts.push(`GPA: ${profile.gpa}`);
    if (profile.sat) parts.push(`SAT: ${profile.sat}`);
    if (profile.toefl) parts.push(`TOEFL: ${profile.toefl}`);
    return parts.length > 0 ? `\n\n[학생 프로필]\n${parts.join("\n")}` : "";
  }

  const sendMessage = async (userMessage: string) => {
    setLoading(true);

    try {
      const cleanHistory = messages.filter((m) => !m.error);

      const data = await fetchWithAuth<{ response: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage + (cleanHistory.length <= 1 ? buildStudentContext() : ""),
          history: cleanHistory,
        }),
      });
      if (!data.response) throw new Error("Empty response");

      setMessages(prev => [...prev, { role: "ai", content: data.response }]);

      if (!isMaster) {
        const newCount = (profile?.aiChatDate === todayKey ? (profile?.aiChatCount || 0) : 0) + 1;
        await saveProfile({ aiChatCount: newCount, aiChatDate: todayKey });
      }
    } catch (error: unknown) {
      console.error(error);
      // 서버에서 429 QUOTA_EXCEEDED면 한도 초과 모달 + 로컬 카운트를 서버 값으로 강제 동기화.
      // 이전엔 클라가 "여유 있음"으로 판단한 요청을 서버가 거부하면 에러 버블만 생기고
      // "오늘 X회 남음" UI가 여전히 남는 문제가 있었음.
      if (error instanceof ApiError && error.status === 429) {
        const details = (error.details as { used?: number; limit?: number } | undefined) || {};
        const serverUsed = typeof details.used === "number" ? details.used : dailyLimit;
        // 로컬 상태를 서버 used 값으로 override → remaining 표시 즉시 정정.
        await saveProfile({ aiChatCount: serverUsed, aiChatDate: todayKey });
        // 답을 못 받을 것이 확정된 낙관적 user 메시지를 제거 — 사용자가 모달 닫을 때
        // "보낸 메시지가 남아 있는데 답이 없는" 혼란을 방지.
        setMessages(prev => prev[prev.length - 1]?.role === "user" ? prev.slice(0, -1) : prev);
        setShowLimitModal(true);
        return;
      }
      // ApiError(서버에서 의미 있는 메시지) 또는 API 키 안내 메시지는 그대로 노출,
      // 그 외(네트워크 오류 등)는 일반 안내로 통일.
      let msg = "연결에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.";
      if (error instanceof ApiError) {
        msg = error.message;
      } else if (error instanceof Error && error.message.includes("API 키")) {
        msg = error.message;
      }
      setMessages(prev => [...prev, {
        role: "ai",
        content: msg,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    await sendMessage(userMessage);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    setMessages(prev => prev.filter(m => !m.error));
    sendMessage(lastUserMsg.content);
  };

  const suggestions: { category: SuggestedCategory; text: string }[] = [
    { category: "지원준비", text: `${profile?.dreamSchool || "Harvard"} 지원 준비, 뭐부터?` },
    { category: "에세이",   text: "Common App 에세이 주제 추천" },
    { category: "시험",     text: "SAT 점수 올리는 가장 빠른 방법" },
    { category: "활동",     text: "경쟁력 있는 과외활동 추천" },
  ];

  const showSuggestions = !loading && messages.every(m => m.role === "ai");

  return (
    <>
    <div
      className="flex flex-col bg-background"
      style={{
        height: "100dvh",
        // BottomNav + iOS 안전 영역 만큼 내부 padding으로 확보.
        // 이전엔 body에 pb-20이 있어 chat이 double-padding으로 오버플로 나던 문제가 있었으나,
        // body의 전역 pb를 제거한 뒤부턴 chat 자체가 자기 영역 clearance를 책임짐.
        paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* ── Header ── */}
      <header className="relative shrink-0 overflow-hidden border-b border-border/60">
        {/* Decorative gradient + blurred orb */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background dark:from-primary/15" aria-hidden="true" />
        <div className="absolute -top-10 -right-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-60" aria-hidden="true" />
        <div className="relative p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-md animate-pulse" aria-hidden="true" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/20">
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg flex items-center gap-1.5">
                AI 카운슬러
                <Badge variant="secondary" className="text-2xs px-1.5 py-0 h-4 bg-primary/10 text-primary border-none font-bold tracking-wide">
                  PRO
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500" />
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </span>
                실시간 상담 중
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMessages([{ role: "ai", content: getGreeting() }]); removeKey(CHAT_KEY); }}
            aria-label="대화 초기화"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            초기화
          </Button>
        </div>
      </header>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
        {/* 50개 저장 한도 근접 시 주의문 — 이전엔 조용히 잘려 사용자가 "이전 대화가 왜 사라졌지" 혼란 */}
        {messages.length >= 40 && (
          <div className="mb-4 mx-auto max-w-md rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 text-center">
            {messages.length >= 50
              ? "최근 50개 메시지만 기기에 저장됩니다. 중요한 내용은 따로 메모해두세요."
              : `기기에는 최근 50개 메시지만 저장돼요 (현재 ${messages.length}개).`}
          </div>
        )}
        {showSuggestions && (
          <EmptyState
            illustration="chat"
            title="AI 카운슬러와 대화하세요"
            description="미국 대학 입시, 에세이, 시험 준비 등 무엇이든 물어보세요"
            className="py-6 mb-2"
          />
        )}
        <div className="space-y-5" aria-live="polite" aria-relevant="additions">
          {messages.map((m, i) => {
            const isNew = i >= messages.length - 2;
            const isAi = m.role === "ai";
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5",
                  isAi ? "flex-row" : "flex-row-reverse",
                  isNew && (isAi ? "animate-msg-ai" : "animate-msg-user")
                )}
              >
                <div className="shrink-0 pt-0.5">
                  {isAi ? (
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/60 blur-[2px] opacity-40" aria-hidden="true" />
                      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-background shadow-sm">
                        <Bot size={15} className="text-white" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center ring-2 ring-background">
                      <User size={15} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="max-w-[82%] space-y-1.5">
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      isAi
                        ? m.error
                          ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-2xl rounded-tl-md border border-red-200 dark:border-red-900"
                          : "bg-card text-foreground rounded-2xl rounded-tl-md shadow-sm ring-1 ring-border/50"
                        : "bg-gradient-to-br from-primary to-primary/85 text-white rounded-2xl rounded-tr-md shadow-md shadow-primary/20"
                    )}
                  >
                    {isAi && i === 0 ? highlightProfile(m.content) : m.content}
                  </div>
                  {m.error && (
                    <Button variant="ghost" size="sm" onClick={handleRetry} className="text-xs text-red-600 gap-1 h-7 px-2 rounded-lg">
                      <RotateCcw className="w-3 h-3" aria-hidden="true" /> 다시 시도
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 animate-msg-ai" role="status" aria-label="AI 응답 대기 중">
              <div className="shrink-0 pt-0.5">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/60 blur-[2px] opacity-40 animate-pulse" aria-hidden="true" />
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-background shadow-sm">
                    <Bot size={15} className="text-white" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-md shadow-sm ring-1 ring-border/50 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-muted-foreground">생각 중</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* ── Suggested questions — 입력창 바로 위에 pin.
           이전엔 메시지 영역 안쪽이라 화면 하단에 빈 공간이 커 보였음. */}
      {showSuggestions && (
        <div className="shrink-0 px-4 pt-1 pb-2 animate-fade-up">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="h-px flex-1 bg-border/60" />
            <p className="text-2xs font-bold text-muted-foreground tracking-wider uppercase">이런 질문 어때요</p>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((q) => {
              const style = SUGGESTION_STYLES[q.category];
              const Icon = style.icon;
              return (
                <button
                  key={q.text}
                  onClick={() => {
                    setInput("");
                    setMessages(prev => [...prev, { role: "user", content: q.text }]);
                    sendMessage(q.text);
                  }}
                  className={cn(
                    "group relative text-left p-2.5 rounded-2xl border bg-gradient-to-br transition-all",
                    "hover:shadow-md active:scale-[0.98]",
                    style.gradient,
                    style.accent,
                    "bg-card"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                      <Icon className={cn("w-3.5 h-3.5", style.iconColor)} />
                    </div>
                    <p className={cn("text-2xs font-bold uppercase tracking-wider truncate", style.iconColor)}>
                      {style.label}
                    </p>
                  </div>
                  <p className="text-xs text-foreground leading-snug line-clamp-2">{q.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-4 pt-1 pb-1 bg-background">
        <div className={cn(
          "relative flex items-end gap-2 p-2 pl-4 rounded-2xl bg-card shadow-glow-sm ring-1 transition-all",
          "ring-border/60 focus-within:ring-primary/40 focus-within:shadow-glow-md"
        )}>
          {/* Remaining-count pill — floats in top-right of the input shell */}
          {dailyLimit !== Infinity && (
            <div className={cn(
              "absolute -top-2 right-4 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ring-1 ring-background",
              limitTone === "red" && "bg-red-500 text-white",
              limitTone === "amber" && "bg-amber-500 text-white",
              limitTone === "primary" && "bg-primary text-primary-foreground",
            )}>
              {remaining > 0 ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-current opacity-80" />
                  오늘 {remaining}회 남음
                </>
              ) : (
                "내일 다시 이용 가능"
              )}
            </div>
          )}

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={remaining <= 0 ? "오늘 무료 상담을 모두 사용했어요" : "무엇이든 물어보세요..."}
            disabled={remaining <= 0}
            aria-label="상담 메시지 입력"
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm h-11 px-0 placeholder:text-muted-foreground/70"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || remaining <= 0}
            aria-label="메시지 전송"
            className={cn(
              "shrink-0 w-11 h-11 rounded-2xl p-0 bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/30",
              "hover:shadow-lg hover:shadow-primary/40 hover:brightness-110 transition-all",
              "disabled:from-muted disabled:to-muted disabled:shadow-none disabled:opacity-50"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-[18px] h-[18px]" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Limit progress bar — subtle, only when close to limit */}
        {dailyLimit !== Infinity && remaining <= 2 && remaining > 0 && (
          <div className="mt-2 px-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  limitTone === "red" ? "bg-red-500" : "bg-amber-500"
                )}
                style={{ width: `${limitRatio * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ChatLimitModal open={showLimitModal} onClose={() => setShowLimitModal(false)} />
    </div>
    <BottomNav />
    </>
  );
}
