
"use client";

import { useState, useRef, useEffect } from "react";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "@/components/BottomNav";
import { streamWithAuth, consumeSSE } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Bot, User, RotateCcw, GraduationCap, PenLine, TrendingUp, Trophy, ArrowRight, BookOpen, FileText, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { EmptyState } from "@/components/EmptyState";
import { normalizePlan, featureLimit } from "@/lib/plans";
import { ChatLimitModal } from "@/components/UpgradeCTA";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { readJSON, writeJSON, removeKey } from "@/lib/storage";
import { ApiError } from "@/lib/api-client";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, deleteDoc, collection, query, orderBy, limit as fsLimit,
  getDocs, addDoc, writeBatch, startAfter, serverTimestamp, Timestamp,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { logError } from "@/lib/log";

interface ChatAction {
  label: string;
  href: string;
}

type ChatSourceType = "profile" | "admission" | "guide";
interface ChatSource {
  id: string;
  type: ChatSourceType;
  label: string;
}

interface Message {
  role: "user" | "ai";
  content: string;
  error?: boolean;
  // Firestore 서브컬렉션 docId — 페이지네이션(cursor)·삭제에 사용. 로컬 최초 생성 메시지엔 없음.
  id?: string;
  // 서버 suggest_actions 도구가 반환한 CTA 버튼 (있으면 AI 메시지 하단에 렌더).
  actions?: ChatAction[];
  // 서버가 system 블록에 주입한 근거 출처 (프로필/합격 사례/가이드).
  sources?: ChatSource[];
}

const ALLOWED_ACTION_HREFS = new Set<string>([
  "/analysis",
  "/essays",
  "/planner",
  "/planner?generate=1",
  "/spec-analysis",
  "/compare",
  "/what-if",
  "/dashboard",
]);

const CHAT_PAGE_SIZE = 50;

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
  return <AuthRequired><ChatPageInner /></AuthRequired>;
}

function ChatPageInner() {
  const { profile, saveProfile, isMaster, user } = useAuth();
  const currentPlan = normalizePlan(profile?.plan);
  const dailyLimit = isMaster ? Infinity : featureLimit(currentPlan, "aiChatDailyLimit");

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const oldestCursorRef = useRef<QueryDocumentSnapshot<unknown> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydration: Firestore 서브컬렉션(users/{uid}/chat) → localStorage → greeting.
  // 서브컬렉션으로 이관(L003): 메시지당 도큐먼트 1개, createdAt desc로 최신 50개만 초기 로드.
  // "이전 대화 더 보기" 버튼으로 startAfter 커서 페이지네이션.
  // 과거 단일 doc("chat/history") 구조는 최초 하이드레이션 시 개별 doc으로 migrate.
  const chatHydratedRef = useRef(false);
  useEffect(() => {
    if (chatHydratedRef.current) return;
    let cancelled = false;

    const hydrate = async () => {
      if (!user) {
        const saved = readJSON<Message[]>(CHAT_KEY);
        if (!cancelled && saved && saved.length > 0) {
          setMessages(saved);
          chatHydratedRef.current = true;
        }
        return;
      }
      try {
        const col = collection(db, "users", user.uid, "chat");
        // 1) 최신 50개 조회
        const pageSnap = await getDocs(
          query(col, orderBy("createdAt", "desc"), fsLimit(CHAT_PAGE_SIZE))
        );
        if (cancelled) return;

        // 서브컬렉션이 비었으면 레거시 "history" 단일 doc 확인 후 migrate
        if (pageSnap.empty) {
          const legacy = await getDoc(doc(db, "users", user.uid, "chat", "history"));
          if (cancelled) return;
          if (legacy.exists()) {
            const data = legacy.data() as { messages?: Message[] };
            const legacyMsgs = Array.isArray(data.messages) ? data.messages : [];
            if (legacyMsgs.length > 0) {
              // Firestore 쓰기 제한(500/batch)보다 항상 작은 규모라 단일 batch로 충분.
              const batch = writeBatch(db);
              const base = Date.now() - legacyMsgs.length;
              legacyMsgs.forEach((m, i) => {
                const ref = doc(col);
                batch.set(ref, {
                  role: m.role,
                  content: m.content,
                  ...(m.error ? { error: true } : {}),
                  // 원래 순서 보존: 개별 timestamp가 없으니 base+i로 단조 증가.
                  createdAt: Timestamp.fromMillis(base + i),
                });
              });
              batch.delete(legacy.ref);
              await batch.commit();
              // migrate 직후 재조회
              const reloaded = await getDocs(
                query(col, orderBy("createdAt", "desc"), fsLimit(CHAT_PAGE_SIZE))
              );
              if (cancelled) return;
              hydrateFromSnapshot(reloaded);
              chatHydratedRef.current = true;
              return;
            }
            // 빈 legacy doc도 정리
            await deleteDoc(legacy.ref).catch(() => {});
          }
        } else {
          hydrateFromSnapshot(pageSnap);
          chatHydratedRef.current = true;
          return;
        }
      } catch (e) {
        logError("[chat] Firestore hydrate failed:", e);
      }
      // Firestore 실패 시 localStorage 폴백
      const saved = readJSON<Message[]>(CHAT_KEY);
      if (!cancelled && saved && saved.length > 0) {
        setMessages(saved);
      }
      chatHydratedRef.current = true;
    };

    function hydrateFromSnapshot(snap: Awaited<ReturnType<typeof getDocs>>) {
      const docs = snap.docs;
      oldestCursorRef.current = docs[docs.length - 1] ?? null;
      setHasMoreOlder(docs.length === CHAT_PAGE_SIZE);
      // desc로 받았으니 오래된 것부터 표시하려면 reverse.
      const loaded: Message[] = docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
        .reverse();
      if (loaded.length > 0) {
        setMessages(loaded);
        try { writeJSON(CHAT_KEY, loaded); } catch {}
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, [user]);

  // Persist: localStorage는 최근 50개만 캐시(UI 즉시 복원용).
  // Firestore 쓰기는 sendMessage 안에서 개별 addDoc으로 이미 처리되므로 여기선 LS만.
  useEffect(() => {
    if (!chatHydratedRef.current) return;
    if (messages.length === 0) return;
    const trimmed = messages.slice(-CHAT_PAGE_SIZE);
    try { writeJSON(CHAT_KEY, trimmed); } catch {}
  }, [messages]);

  const loadOlderMessages = async () => {
    if (!user || loadingOlder || !hasMoreOlder) return;
    const cursor = oldestCursorRef.current;
    if (!cursor) return;
    setLoadingOlder(true);
    try {
      const col = collection(db, "users", user.uid, "chat");
      const snap = await getDocs(
        query(col, orderBy("createdAt", "desc"), startAfter(cursor), fsLimit(CHAT_PAGE_SIZE))
      );
      const docs = snap.docs;
      oldestCursorRef.current = docs[docs.length - 1] ?? oldestCursorRef.current;
      setHasMoreOlder(docs.length === CHAT_PAGE_SIZE);
      const older: Message[] = docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
        .reverse();
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
    } catch (e) {
      logError("[chat] load older failed:", e);
    } finally {
      setLoadingOlder(false);
    }
  };

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

  const persistMessage = async (msg: Message) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "chat"), {
        role: msg.role,
        content: msg.content,
        ...(msg.error ? { error: true } : {}),
        ...(msg.actions ? { actions: msg.actions } : {}),
        ...(msg.sources ? { sources: msg.sources } : {}),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      logError("[chat] persist failed:", e);
    }
  };

  const sendMessage = async (userMessage: string) => {
    setLoading(true);

    try {
      const cleanHistory = messages.filter((m) => !m.error);

      // 프로필/specs/관심 학교/익명 합격 사례는 서버(/api/chat)가 Firestore에서 직접 읽어
      // system 블록에 주입. 클라이언트는 질문 원문만 보냄.
      const res = await streamWithAuth("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          history: cleanHistory,
        }),
      });

      // 스트림 시작 직전에 빈 AI 메시지를 추가해 placeholder 역할.
      // 이후 delta가 도착할 때마다 마지막 메시지 content를 누적 업데이트.
      // 첫 토큰 도착 전까지 typing indicator(loading=true)는 유지.
      let aiInserted = false;
      let accumulated = "";
      let accumulatedActions: ChatAction[] = [];
      let accumulatedSources: ChatSource[] = [];
      let streamErr: string | null = null;

      await consumeSSE(res, (event, data) => {
        if (event === "delta") {
          const text = (data as { text?: string } | null)?.text ?? "";
          if (!text) return;
          accumulated += text;
          if (!aiInserted) {
            aiInserted = true;
            setLoading(false);
            setMessages(prev => [
              ...prev,
              {
                role: "ai",
                content: accumulated,
                ...(accumulatedSources.length ? { sources: accumulatedSources } : {}),
              },
            ]);
          } else {
            setMessages(prev => {
              const next = prev.slice();
              const last = next[next.length - 1];
              if (last && last.role === "ai") {
                next[next.length - 1] = { ...last, content: accumulated };
              }
              return next;
            });
          }
        } else if (event === "sources") {
          // 서버가 system 블록에 넣은 실제 근거 — 이미 AI 메시지가 있으면 바로 첨부,
          // 아직 없으면 accumulatedSources에 보관하고 delta 삽입 시 같이 적용.
          const raw = (data as { sources?: unknown } | null)?.sources;
          if (!Array.isArray(raw)) return;
          const srcs: ChatSource[] = raw
            .filter((s): s is ChatSource =>
              !!s && typeof s === "object"
              && typeof (s as ChatSource).id === "string"
              && typeof (s as ChatSource).label === "string"
              && (["profile", "admission", "guide"] as const).includes((s as ChatSource).type))
            .slice(0, 5);
          if (!srcs.length) return;
          accumulatedSources = srcs;
          if (aiInserted) {
            setMessages(prev => {
              const next = prev.slice();
              const last = next[next.length - 1];
              if (last && last.role === "ai") {
                next[next.length - 1] = { ...last, sources: srcs };
              }
              return next;
            });
          }
        } else if (event === "actions") {
          // 서버 suggest_actions 도구 결과 — allow-list 필터 후 마지막 AI 메시지에 첨부.
          const raw = (data as { actions?: unknown } | null)?.actions;
          if (!Array.isArray(raw)) return;
          const actions: ChatAction[] = raw
            .filter((a): a is ChatAction =>
              !!a && typeof a === "object"
              && typeof (a as ChatAction).label === "string"
              && typeof (a as ChatAction).href === "string"
              && ALLOWED_ACTION_HREFS.has((a as ChatAction).href))
            .slice(0, 3);
          if (!actions.length) return;
          accumulatedActions = actions;
          setMessages(prev => {
            const next = prev.slice();
            const last = next[next.length - 1];
            if (last && last.role === "ai") {
              next[next.length - 1] = { ...last, actions };
            }
            return next;
          });
        } else if (event === "error") {
          streamErr = (data as { message?: string } | null)?.message
            || "AI 응답 생성에 실패했어요.";
        }
      });

      if (streamErr) throw new Error(streamErr);
      if (!accumulated) throw new Error("Empty response");

      // 최종 메시지를 Firestore에 영속화 (delta마다 쓰기는 비용·쿼터 부담).
      persistMessage({
        role: "ai",
        content: accumulated,
        ...(accumulatedActions.length ? { actions: accumulatedActions } : {}),
        ...(accumulatedSources.length ? { sources: accumulatedSources } : {}),
      });

      if (!isMaster) {
        const newCount = (profile?.aiChatDate === todayKey ? (profile?.aiChatCount || 0) : 0) + 1;
        await saveProfile({ aiChatCount: newCount, aiChatDate: todayKey });
      }
    } catch (error: unknown) {
      logError(error);
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
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    persistMessage(userMsg);
    await sendMessage(userMessage);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    setMessages(prev => prev.filter(m => !m.error));
    sendMessage(lastUserMsg.content);
  };

  // 학년별 prompt 추천 — 지금 시기에 가장 도움 되는 질문을 frontload.
  // 9·10학년은 기반 만들기, 11학년은 시험·활동 우선, 12학년은 에세이·지원 마감.
  const suggestions: { category: SuggestedCategory; text: string }[] = (() => {
    const school = profile?.dreamSchool || "Harvard";
    const grade = profile?.grade || "";
    if (grade.startsWith("9") || grade.startsWith("10")) {
      return [
        { category: "활동",     text: "9·10학년에 시작할 만한 활동 추천" },
        { category: "시험",     text: "SAT 준비, 언제부터 시작할까?" },
        { category: "지원준비", text: `${school} 가려면 지금 뭘 해야 해?` },
        { category: "에세이",   text: "에세이 미리 연습할 주제 알려줘" },
      ];
    }
    if (grade.startsWith("11")) {
      return [
        { category: "시험",     text: "SAT 점수 올리는 가장 빠른 방법" },
        { category: "활동",     text: "11학년에 추가하면 좋은 활동" },
        { category: "지원준비", text: `${school} 합격 가능성 진단해줘` },
        { category: "에세이",   text: "Common App 에세이 주제 추천" },
      ];
    }
    if (grade.startsWith("12") || grade.startsWith("졸")) {
      return [
        { category: "에세이",   text: "Common App 에세이 1차 피드백" },
        { category: "지원준비", text: `${school} ED·EA 마감 전 체크리스트` },
        { category: "에세이",   text: "Why Major 에세이 어떻게 써?" },
        { category: "지원준비", text: "추천서 부탁할 선생님 정하는 법" },
      ];
    }
    return [
      { category: "지원준비", text: `${school} 지원 준비, 뭐부터?` },
      { category: "에세이",   text: "Common App 에세이 주제 추천" },
      { category: "시험",     text: "SAT 점수 올리는 가장 빠른 방법" },
      { category: "활동",     text: "경쟁력 있는 과외활동 추천" },
    ];
  })();

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
            onClick={() => setShowResetConfirm(true)}
            aria-label="대화 초기화"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            초기화
          </Button>
        </div>
      </header>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="대화 기록을 삭제할까요?"
        description="지금까지의 AI 상담 내용이 모두 지워져요. 되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={async () => {
          setMessages([{ role: "ai", content: getGreeting() }]);
          removeKey(CHAT_KEY);
          oldestCursorRef.current = null;
          setHasMoreOlder(false);
          if (user) {
            // 서브컬렉션 전체 삭제 — 페이지당 500씩 반복.
            // 레거시 "history" 단일 doc도 함께 정리.
            const col = collection(db, "users", user.uid, "chat");
            try {
              await deleteDoc(doc(db, "users", user.uid, "chat", "history")).catch(() => {});
              while (true) {
                const snap = await getDocs(query(col, fsLimit(500)));
                if (snap.empty) break;
                const batch = writeBatch(db);
                snap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
                if (snap.size < 500) break;
              }
            } catch (e) {
              logError("[chat] reset failed:", e);
            }
          }
        }}
      />

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 lg:max-w-content lg:mx-auto lg:w-full">
        {hasMoreOlder && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOlderMessages}
              disabled={loadingOlder}
              className="rounded-full text-xs"
            >
              {loadingOlder ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
              이전 대화 더 보기
            </Button>
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
                  {isAi && Array.isArray(m.sources) && m.sources.length > 0 && (
                    <div className="pt-1.5 pb-0.5">
                      <p className="text-2xs font-semibold text-muted-foreground/80 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        이 답변은 다음을 참고했어요
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {m.sources.map((source) => {
                          const Icon =
                            source.type === "profile" ? UserCircle2 :
                            source.type === "admission" ? FileText :
                            BookOpen;
                          const tone =
                            source.type === "profile" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20" :
                            source.type === "admission" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20" :
                            "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20";
                          return (
                            <span
                              key={source.id}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ring-1",
                                tone
                              )}
                            >
                              <Icon className="w-3 h-3" aria-hidden="true" />
                              {source.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isAi && Array.isArray(m.actions) && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.actions.map((a, ai) => (
                        <Link
                          key={`${a.href}-${ai}`}
                          href={a.href}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium",
                            "bg-primary/10 text-primary hover:bg-primary/15 active:scale-[0.97] transition-all",
                            "ring-1 ring-primary/20"
                          )}
                        >
                          {a.label}
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  )}
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
                    const userMsg: Message = { role: "user", content: q.text };
                    setMessages(prev => [...prev, userMsg]);
                    persistMessage(userMsg);
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
      <div className="shrink-0 px-4 pt-1 pb-1 bg-background lg:max-w-content lg:mx-auto lg:w-full">
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
