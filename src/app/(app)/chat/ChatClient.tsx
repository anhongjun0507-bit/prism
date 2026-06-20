"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { useAuth, type UserProfile } from "@/lib/auth-context";
import { ApiError, consumeSSE, streamWithAuth } from "@/lib/api-client";
import { normalizePlan } from "@/lib/plans";
import { logError } from "@/lib/log";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  ALLOWED_ACTION_HREFS,
  type ChatAction,
  type ChatMessage,
  type ChatSource,
} from "@/types/chat";
import { chatDailyLimit, getChatCount, incrementChatCount } from "@/lib/chat-quota";
import { toast } from "@/components/ui/sonner";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { SuggestionChips, type Suggestion } from "@/components/chat/SuggestionChips";

/** 로컬 캐시 상한 — 첫 paint 복원용. (Part 2에서 Firestore가 source of truth) */
const HISTORY_CAP = 50;

/** 프로필 기반 개인화 인사 (원본 getGreeting 로직 유지). */
function getGreeting(profile: UserProfile | null): string {
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

/** 학년별 추천 질문 (원본 로직 유지) — 지금 시기에 가장 도움 되는 질문을 frontload. */
function getSuggestions(profile: UserProfile | null): Suggestion[] {
  const school = profile?.dreamSchool || "Harvard";
  const grade = profile?.grade || "";
  if (grade.startsWith("9") || grade.startsWith("10")) {
    return [
      { category: "활동", text: "9·10학년에 시작할 만한 활동 추천" },
      { category: "시험", text: "SAT 준비, 언제부터 시작할까?" },
      { category: "지원준비", text: `${school} 가려면 지금 뭘 해야 해?` },
      { category: "에세이", text: "에세이 미리 연습할 주제 알려줘" },
    ];
  }
  if (grade.startsWith("11")) {
    return [
      { category: "시험", text: "SAT 점수 올리는 가장 빠른 방법" },
      { category: "활동", text: "11학년에 추가하면 좋은 활동" },
      { category: "지원준비", text: `${school} 합격 가능성 진단해줘` },
      { category: "에세이", text: "Common App 에세이 주제 추천" },
    ];
  }
  if (grade.startsWith("12") || grade.startsWith("졸")) {
    return [
      { category: "에세이", text: "Common App 에세이 1차 피드백" },
      { category: "지원준비", text: `${school} ED·EA 마감 전 체크리스트` },
      { category: "에세이", text: "Why Major 에세이 어떻게 써?" },
      { category: "지원준비", text: "추천서 부탁할 선생님 정하는 법" },
    ];
  }
  return [
    { category: "지원준비", text: `${school} 지원 준비, 뭐부터?` },
    { category: "에세이", text: "Common App 에세이 주제 추천" },
    { category: "시험", text: "SAT 점수 올리는 가장 빠른 방법" },
    { category: "활동", text: "경쟁력 있는 과외활동 추천" },
  ];
}

export function ChatClient() {
  const { profile, isMaster, loading: authLoading } = useAuth();
  const plan = normalizePlan(profile?.plan);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatCount, setChatCount] = useState(0);

  const hydratedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 쿼터 (UX 힌트) — 서버가 진짜 enforce.
  const limit = chatDailyLimit(plan, isMaster);
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - chatCount) : Infinity;
  const exhausted = remaining <= 0;

  useEffect(() => {
    setChatCount(getChatCount());
  }, []);

  // hydrate: localStorage → (없으면) 개인화 greeting. greeting은 auth 해소 후 한 번만.
  useEffect(() => {
    if (hydratedRef.current) return;
    const saved = readJSON<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setMessages(saved);
      hydratedRef.current = true;
    } else if (!authLoading) {
      setMessages([{ role: "ai", content: getGreeting(profile) }]);
      hydratedRef.current = true;
    }
  }, [authLoading, profile]);

  // persist (최근 50개)
  useEffect(() => {
    if (!hydratedRef.current || messages.length === 0) return;
    writeJSON(STORAGE_KEYS.CHAT_HISTORY, messages.slice(-HISTORY_CAP));
  }, [messages]);

  // 새 콘텐츠마다 하단으로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const suggestions = useMemo(() => getSuggestions(profile), [profile]);
  const showSuggestions =
    !streaming && messages.length > 0 && messages.every((m) => m.role === "ai");

  /** 마지막 AI 메시지를 patch (스트리밍 누적·sources·actions·error 반영). */
  const patchLastAi = (patch: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "ai") {
          next[i] = { ...next[i], ...patch };
          break;
        }
      }
      return next;
    });
  };

  const send = async (text: string, base?: ChatMessage[]) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    if (exhausted) {
      toast.error("오늘 무료 상담을 모두 사용했어요.");
      return;
    }

    const history = (base ?? messages)
      .filter((m) => m.content?.trim() && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setInput("");
    setMessages((prev) => [
      ...(base ?? prev),
      { role: "user", content: trimmed },
      { role: "ai", content: "" },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let acc = "";
    let streamErr: string | null = null;

    try {
      const res = await streamWithAuth("/api/chat", {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });
      // 스트림이 실제로 열린 뒤에만 카운트(인증/쿼터 거절은 위에서 throw).
      setChatCount(incrementChatCount());

      await consumeSSE(res, (event, data) => {
        if (event === "delta") {
          const t = (data as { text?: unknown } | null)?.text;
          if (typeof t === "string") {
            acc += t;
            patchLastAi({ content: acc });
          }
        } else if (event === "sources") {
          const raw = (data as { sources?: unknown } | null)?.sources;
          if (Array.isArray(raw)) {
            const sources = raw.filter(
              (s): s is ChatSource =>
                !!s &&
                typeof s === "object" &&
                typeof (s as ChatSource).id === "string" &&
                typeof (s as ChatSource).label === "string" &&
                ["profile", "admission", "guide"].includes((s as ChatSource).type),
            );
            if (sources.length) patchLastAi({ sources });
          }
        } else if (event === "actions") {
          const raw = (data as { actions?: unknown } | null)?.actions;
          if (Array.isArray(raw)) {
            const actions = raw
              .filter(
                (a): a is ChatAction =>
                  !!a &&
                  typeof a === "object" &&
                  typeof (a as ChatAction).label === "string" &&
                  typeof (a as ChatAction).href === "string" &&
                  ALLOWED_ACTION_HREFS.has((a as ChatAction).href),
              )
              .slice(0, 3);
            if (actions.length) patchLastAi({ actions });
          }
        } else if (event === "error") {
          streamErr = (data as { message?: string } | null)?.message ?? "AI 응답 생성에 실패했어요.";
        }
      });

      if (streamErr) {
        patchLastAi({ content: acc || streamErr, error: !acc });
      } else if (!acc) {
        patchLastAi({ content: "응답을 받지 못했어요. 다시 시도해주세요.", error: true });
      }
    } catch (err) {
      if (controller.signal.aborted) {
        // 사용자 중단 — 누적 텍스트는 유지, 비어있으면 placeholder 제거.
        if (!acc) {
          setMessages((prev) =>
            prev.length && prev[prev.length - 1].role === "ai" && !prev[prev.length - 1].content
              ? prev.slice(0, -1)
              : prev,
          );
        }
      } else if (err instanceof ApiError && (err.status === 429 || err.code === "QUOTA_EXCEEDED")) {
        setChatCount(limit); // 클라 힌트도 소진 처리
        patchLastAi({
          content: "오늘 무료 상담을 모두 사용했어요. Pro로 업그레이드하면 무제한으로 이용할 수 있어요.",
          error: true,
        });
      } else if (err instanceof ApiError) {
        patchLastAi({ content: err.message, error: true });
      } else {
        logError("[chat] stream failed:", err);
        patchLastAi({ content: "연결에 문제가 있어요. 잠시 후 다시 시도해주세요.", error: true });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([{ role: "ai", content: getGreeting(profile) }]);
    removeKey(STORAGE_KEYS.CHAT_HISTORY);
  };

  const handleRegenerate = () => {
    if (streaming) return;
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx < 0) return;
    void send(messages[idx].content, messages.slice(0, idx));
  };

  const hasUserTurn = messages.some((m) => m.role === "user");

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 flex flex-col bg-background md:bottom-0 md:left-60">
      <ChatHeader plan={plan} isMaster={isMaster} onReset={handleReset} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.map((m, i) => {
            const isLastAi = m.role === "ai" && i === messages.length - 1;
            return (
              <ChatBubble
                key={i}
                message={m}
                streaming={streaming && isLastAi}
                canRegenerate={isLastAi && !streaming && hasUserTurn}
                onRegenerate={handleRegenerate}
              />
            );
          })}

          {showSuggestions && (
            <SuggestionChips suggestions={suggestions} onPick={(t) => void send(t)} />
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {exhausted ? (
            <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-center">
              <p className="text-small text-foreground">
                오늘 무료 상담 {Number.isFinite(limit) ? `${limit}회` : ""}을 모두 사용했어요. 내일 다시 이용할 수 있어요.
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                Pro 플랜으로 업그레이드하면 무제한으로 상담할 수 있어요.
              </p>
              <Link
                href="/pricing"
                className="mt-2 inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-caption font-medium text-foreground transition-colors hover:bg-secondary/70"
              >
                요금제 보기
              </Link>
            </div>
          ) : (
            <>
              <ChatComposer
                value={input}
                onChange={setInput}
                onSend={() => void send(input)}
                onStop={handleStop}
                streaming={streaming}
              />
              {Number.isFinite(remaining) && (
                <p className="mt-1.5 text-center text-caption text-muted-foreground">
                  오늘 남은 무료 상담 {remaining}회
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
