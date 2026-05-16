"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Copy, Share2, Trash2, Plus, AlertCircle, Send, Mail, MessageCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { trackPrismEvent } from "@/lib/analytics/events";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonWrapper } from "@/components/ui/skeleton-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ParentViewTokenLike } from "@/lib/parent/types";

type IssueResponse = ParentViewTokenLike;
interface ListResponse {
  tokens: ParentViewTokenLike[];
}

const MAX_ACTIVE = 3;

export function ParentShareSection() {
  const [tokens, setTokens] = useState<ParentViewTokenLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  // 보내기 모달 — 발급된 token을 선택해 카카오/이메일/URL 옵션 노출 (2-7 audit)
  const [sendModal, setSendModal] = useState<ParentViewTokenLike | null>(null);
  const { toast } = useToast();
  const showApiError = useApiErrorToast();
  const [tokensRef] = useAutoAnimate<HTMLUListElement>({
    duration: 250,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWithAuth<ListResponse>("/api/parent/tokens");
      setTokens(data.tokens || []);
    } catch (err) {
      showApiError(err, { title: "학부모 링크 목록을 불러오지 못했어요" });
    } finally {
      setLoading(false);
    }
  }, [showApiError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canIssue = tokens.length < MAX_ACTIVE;

  const handleIssue = async () => {
    if (!canIssue || issuing) return;
    setIssuing(true);
    try {
      const newToken = await fetchWithAuth<IssueResponse>("/api/parent/tokens", {
        method: "POST",
      });
      setTokens((prev) => [newToken, ...prev]);
      trackPrismEvent("parent_token_issued", { plan: newToken.plan });
      toast({
        title: "새 학부모 링크가 발급됐어요",
        description: "URL 복사 또는 카톡 공유 버튼으로 학부모님께 보내주세요.",
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "MAX_TOKENS_REACHED") {
        toast({
          title: "활성 링크가 최대치예요",
          description: "기존 링크를 취소한 후 새로 발급해주세요.",
          variant: "destructive",
        });
      } else {
        showApiError(err, { title: "링크 발급 실패" });
      }
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (token: string) => {
    if (revoking) return;
    setRevoking(token);
    try {
      await fetchWithAuth(`/api/parent/tokens/${token}`, { method: "DELETE" });
      setTokens((prev) => prev.filter((t) => t.token !== token));
      trackPrismEvent("parent_token_revoked", {});
      toast({ title: "링크를 취소했어요" });
    } catch (err) {
      showApiError(err, { title: "링크 취소 실패" });
    } finally {
      setRevoking(null);
    }
  };

  const buildUrl = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/parent-view/${token}` : "";

  const handleCopy = async (token: string) => {
    const url = buildUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      trackPrismEvent("parent_token_shared", { method: "clipboard" });
      toast({ title: "URL이 복사됐어요", description: "학부모님께 보내주세요." });
    } catch {
      toast({
        title: "URL 복사 실패",
        description: "브라우저 권한을 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (t: ParentViewTokenLike) => {
    const url = buildUrl(t.token);
    const text = `${t.studentName} 학부모님, 입시 진행 상황을 확인하실 수 있어요. (PRISM)`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "PRISM 학부모 리포트", text, url });
        trackPrismEvent("parent_token_shared", { method: "web_share" });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    // Fallback: clipboard
    await handleCopy(t.token);
  };

  const buildShareMessage = (t: ParentViewTokenLike) => {
    const url = buildUrl(t.token);
    return `${t.studentName} 학부모님, 입시 진행 상황을 확인하실 수 있어요. (PRISM)\n\n${url}`;
  };

  const sendKakao = (t: ParentViewTokenLike) => {
    // Kakao 공식 share SDK 없이도 안정적인 방법: navigator.share를 우선 시도 (모바일에서 카카오톡이
    // 시스템 share 시트에 포함됨). 데스크톱이면 URL 복사 + "카톡에 붙여넣기" 안내.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      navigator.share({
        title: "PRISM 학부모 리포트",
        text: buildShareMessage(t),
        url: buildUrl(t.token),
      }).then(() => {
        trackPrismEvent("parent_token_shared", { method: "kakao" });
      }).catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        void handleCopy(t.token);
      });
    } else {
      void handleCopy(t.token);
      toast({
        title: "URL이 복사됐어요",
        description: "카카오톡 채팅창에 붙여넣어 보내주세요.",
      });
      trackPrismEvent("parent_token_shared", { method: "kakao_desktop" });
    }
  };

  const sendEmail = (t: ParentViewTokenLike) => {
    const subject = encodeURIComponent("[PRISM] 자녀 입시 진행 상황 리포트");
    const body = encodeURIComponent(buildShareMessage(t));
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
    trackPrismEvent("parent_token_shared", { method: "email" });
  };

  return (
    <Card className="p-5 bg-card border-none shadow-sm space-y-4">
      <div>
        <h3 className="font-headline font-bold text-base flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" /> 학부모와 공유하기
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          학부모님께 view-only 링크를 보낼 수 있어요. 로그인 없이 자녀의 리포트를 확인하세요.
        </p>
      </div>

      <SkeletonWrapper
        loading={loading}
        skeleton={
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        }
      >
        {tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            아직 발급된 링크가 없어요. 아래 버튼으로 새 링크를 만들어주세요.
          </p>
        ) : (
          <ul ref={tokensRef} className="space-y-3">
            {tokens.map((t) => (
              <TokenCard
                key={t.token}
                token={t}
                busy={revoking === t.token}
                onCopy={() => handleCopy(t.token)}
                onShare={() => handleShare(t)}
                onSendClick={() => setSendModal(t)}
                onRevoke={() => setConfirmRevoke(t.token)}
              />
            ))}
          </ul>
        )}
      </SkeletonWrapper>

      {canIssue ? (
        <Button
          type="button"
          className="w-full gap-2"
          onClick={handleIssue}
          isLoading={issuing}
          disabled={issuing}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />새 학부모 링크 발급
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground flex items-start gap-2 bg-muted/30 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          최대 {MAX_ACTIVE}개까지 발급할 수 있어요. 기존 링크를 취소한 후 새로 발급해주세요.
        </p>
      )}

      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        💡 발급된 링크는 <strong>7일</strong> 동안 유효하고, 최대 <strong>100번</strong>까지
        조회할 수 있어요. 필요할 때 언제든 취소할 수 있어요.
      </p>

      <ConfirmDialog
        open={confirmRevoke !== null}
        onOpenChange={(open) => !open && setConfirmRevoke(null)}
        title="이 링크를 취소할까요?"
        description="취소하면 학부모님이 더 이상 리포트를 볼 수 없어요. 이 작업은 되돌릴 수 없어요."
        confirmLabel="취소하기"
        cancelLabel="유지"
        destructive
        onConfirm={() => {
          if (confirmRevoke) {
            const t = confirmRevoke;
            setConfirmRevoke(null);
            void handleRevoke(t);
          }
        }}
      />

      {/* 보내기 모달 — 카카오/이메일/URL 복사 선택지 + 미리보기 메시지 (2-7 audit) */}
      <Dialog
        open={sendModal !== null}
        onOpenChange={(open) => !open && setSendModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>학부모께 보내기</DialogTitle>
            <DialogDescription>
              아래 미리보기로 보낼 메시지를 확인하고, 사용하실 채널을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          {sendModal && (
            <>
              <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                {buildShareMessage(sendModal)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-1.5 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] border-[#FEE500] hover:border-[#FEE500]"
                  onClick={() => {
                    sendKakao(sendModal);
                    setSendModal(null);
                  }}
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  카카오톡
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-1.5"
                  onClick={() => {
                    sendEmail(sendModal);
                    setSendModal(null);
                  }}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  이메일
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-1.5"
                  onClick={() => {
                    void handleCopy(sendModal.token);
                    setSendModal(null);
                  }}
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  URL 복사
                </Button>
              </div>
            </>
          )}
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => setSendModal(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TokenCard({
  token: t,
  busy,
  onCopy,
  onShare,
  onSendClick,
  onRevoke,
}: {
  token: ParentViewTokenLike;
  busy: boolean;
  onCopy: () => void;
  onShare: () => void;
  onSendClick: () => void;
  onRevoke: () => void;
}) {
  const expiresIn = formatRemaining(t.expiresAt);
  const msLeft = new Date(t.expiresAt).getTime() - Date.now();
  const expiringSoon = msLeft > 0 && msLeft < 24 * 60 * 60 * 1000;
  return (
    <li className={`rounded-xl p-3 space-y-3 ${expiringSoon ? "bg-amber-50/60 dark:bg-amber-950/15 ring-1 ring-amber-300/40 dark:ring-amber-700/40" : "bg-muted/30"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono text-muted-foreground truncate">
            /parent-view/{t.token.slice(0, 8)}…
          </p>
          <p className={`text-xs mt-1 ${expiringSoon ? "text-amber-700 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
            조회 {t.viewCount} / {t.viewLimit}회 · {expiresIn} 남음{expiringSoon ? " — 곧 만료" : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={onRevoke}
          isLoading={busy}
          disabled={busy}
          aria-label="링크 취소"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onSendClick}
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          학부모께 보내기
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onCopy}
          aria-label="URL 복사"
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onShare}
          aria-label="시스템 공유"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

function formatRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "만료됨";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}일`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}시간`;
  const minutes = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${minutes}분`;
}
