
"use client";

import { useState, useRef, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Bot, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { ChatLimitModal } from "@/components/UpgradeCTA";

interface Message {
  role: "user" | "ai";
  content: string;
  error?: boolean;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChatPage() {
  const { profile, saveProfile } = useAuth();
  const currentPlan = profile?.plan || "free";
  const dailyLimit = PLANS[currentPlan].limits.aiChatPerDay;

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
    try {
      const saved = localStorage.getItem(CHAT_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-50))); } catch {}
    }
  }, [messages]);

  const todayKey = getTodayKey();
  const chatCount = profile?.aiChatDate === todayKey ? (profile?.aiChatCount || 0) : 0;
  const remaining = dailyLimit === Infinity ? Infinity : dailyLimit - chatCount;

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      // Don't auto-scroll on initial load — start from the top
      isInitialLoad.current = false;
      return;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Build student context for AI
  function buildStudentContext(): string {
    if (!profile) return "";
    const parts: string[] = [];
    if (profile.name) parts.push(`학생 이름: ${profile.name}`);
    if (profile.grade) parts.push(`학년: ${profile.grade}`);
    if (profile.dreamSchool) parts.push(`목표 대학: ${profile.dreamSchool}`);
    if (profile.major) parts.push(`지망 전공: ${profile.major}`);
    if (profile.gpa) parts.push(`GPA: ${profile.gpa}`);
    if (profile.sat) parts.push(`SAT: ${profile.sat}`);
    if (profile.toefl) parts.push(`TOEFL: ${profile.toefl}`);
    return parts.length > 0 ? `\n\n[학생 프로필]\n${parts.join("\n")}` : "";
  }

  const sendMessage = async (userMessage: string) => {
    setLoading(true);

    try {
      // Keep all messages except errors for API history (including AI greeting for context)
      const cleanHistory = messages.filter((m) => !m.error);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage + (cleanHistory.length <= 1 ? buildStudentContext() : ""),
          history: cleanHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API request failed");

      if (!data.response) throw new Error("Empty response");

      setMessages(prev => [...prev, { role: "ai", content: data.response }]);

      // Only count on success
      const newCount = (profile?.aiChatDate === todayKey ? (profile?.aiChatCount || 0) : 0) + 1;
      await saveProfile({ aiChatCount: newCount, aiChatDate: todayKey });
    } catch (error: any) {
      console.error(error);
      const msg = error?.message?.includes("API 키")
        ? error.message
        : "연결에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.";
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
    // Find last user message before the error
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    // Remove error message
    setMessages(prev => prev.filter(m => !m.error));
    sendMessage(lastUserMsg.content);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 px-6 bg-white dark:bg-card border-b border-border flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg">AI 카운슬러</h1>
            <p className="text-xs text-green-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 실시간 상담 중
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setMessages([]); localStorage.removeItem(CHAT_KEY); }} className="text-xs text-muted-foreground">
            초기화
          </Button>
          {dailyLimit !== Infinity && (
            <Badge variant="secondary" className={`text-xs ${remaining <= 0 ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" : ""}`}>
              {remaining > 0 ? `오늘 ${remaining}회 남음` : "내일 다시 이용 가능"}
            </Badge>
          )}
        </div>
      </header>

      {/* Messages area - grows to fill, scroll internally */}
      <div className="flex-1 overflow-y-auto p-6 pb-4">
        <div className="space-y-6" aria-live="polite" aria-relevant="additions">
          {messages.map((m, i) => {
            const isNew = i >= messages.length - 2;
            return (
            <div key={i} className={cn(
              "flex gap-3",
              m.role === "user" ? "flex-row-reverse" : "flex-row",
              isNew && (m.role === "user" ? "animate-msg-user" : "animate-msg-ai")
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                m.role === "ai" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                {m.role === "ai" ? <Bot size={16} aria-hidden="true" /> : <User size={16} aria-hidden="true" />}
              </div>
              <div className="max-w-[80%] space-y-2">
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  m.role === "ai"
                    ? m.error
                      ? "bg-red-50 text-red-700 rounded-tl-none"
                      : "bg-white dark:bg-card border-none shadow-sm text-foreground rounded-tl-none"
                    : "bg-primary text-white rounded-tr-none"
                )}>
                  {m.content}
                </div>
                {m.error && (
                  <Button variant="ghost" size="sm" onClick={handleRetry} className="text-xs text-red-600 gap-1 h-7 px-2">
                    <RotateCcw className="w-3 h-3" /> 다시 시도
                  </Button>
                )}
              </div>
            </div>
            );
          })}
          {/* Example questions — shown only when no user messages yet */}
          {!loading && messages.every(m => m.role === "ai") && (
            <div className="flex flex-col items-center gap-2.5 pt-2 pb-4">
              <p className="text-xs text-muted-foreground mb-1">이런 질문을 해보세요</p>
              {[
                { emoji: "\uD83C\uDF93", text: `${profile?.dreamSchool || "Harvard"}에 지원하려면 어떤 준비가 필요해요?` },
                { emoji: "\uD83D\uDCDD", text: "Common App 에세이 주제 추천해주세요" },
                { emoji: "\uD83D\uDCCA", text: "SAT 점수를 올리는 가장 효과적인 방법은?" },
                { emoji: "\uD83C\uDFC6", text: "과외활동 추천해주세요" },
              ].map((q) => (
                <button
                  key={q.text}
                  onClick={() => {
                    setInput("");
                    setMessages(prev => [...prev, { role: "user", content: `${q.emoji} ${q.text}` }]);
                    sendMessage(`${q.emoji} ${q.text}`);
                  }}
                  className="w-full max-w-sm text-left px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 active:scale-[0.98] transition-all text-sm text-foreground"
                >
                  <span className="mr-2">{q.emoji}</span>{q.text}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex gap-3 animate-msg-ai" role="status" aria-label="AI 응답 대기 중">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <Bot size={16} aria-hidden="true" />
              </div>
              <div className="bg-white dark:bg-card p-4 rounded-2xl text-sm rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                AI가 생각 중입니다...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input - fixed above BottomNav */}
      <div className="shrink-0 p-4 px-6 pb-20 bg-gradient-to-t from-background via-background to-transparent">
        {/* Remaining chat progress bar */}
        {dailyLimit !== Infinity && (
          remaining > 0 ? (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${remaining <= 1 ? "bg-red-500" : remaining <= 2 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${(remaining / dailyLimit) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium shrink-0 ${remaining <= 1 ? "text-red-500" : "text-muted-foreground"}`}>
                오늘 {remaining}회 남음
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 px-1 py-2 bg-red-50 dark:bg-red-950/20 rounded-xl">
              <div className="flex-1 h-1.5 bg-red-200 dark:bg-red-900 rounded-full" />
              <span className="text-xs font-medium text-red-500 shrink-0">
                오늘 {dailyLimit}회 모두 사용했어요
              </span>
            </div>
          )
        )}
        <div className="glass-card p-2 rounded-2xl flex gap-2 shadow-xl border border-white/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={remaining <= 0 ? "오늘 무료 상담을 모두 사용했어요" : "상담하고 싶은 내용을 입력하세요..."}
            disabled={remaining <= 0}
            aria-label="상담 메시지 입력"
            className="border-none bg-transparent focus-visible:ring-0 text-sm h-12"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || remaining <= 0}
            aria-label="메시지 전송"
            className="w-12 h-12 rounded-xl shrink-0 p-0"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ChatLimitModal open={showLimitModal} onClose={() => setShowLimitModal(false)} />
      <BottomNav />
    </div>
  );
}
