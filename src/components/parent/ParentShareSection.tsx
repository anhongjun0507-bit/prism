"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, Loader2, Trash2 } from "lucide-react";
import { ApiError, fetchWithAuth } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TokenItem {
  token: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  viewLimit: number;
}

/** 학생용 공유 섹션 — view-only 링크 발급/복사/취소. Free는 업셀 + 샘플. */
export function ParentShareSection({ isPaid }: { isPaid: boolean }) {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (t: string) => `${origin}/parent-view/${t}`;

  useEffect(() => {
    if (!isPaid) return;
    setLoading(true);
    fetchWithAuth<{ tokens: TokenItem[] }>("/api/parent/tokens")
      .then((d) => setTokens(d.tokens ?? []))
      .catch(() => {
        /* 목록 로드 실패는 조용히 — 발급은 가능 */
      })
      .finally(() => setLoading(false));
  }, [isPaid]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const t = await fetchWithAuth<TokenItem>("/api/parent/tokens", { method: "POST" });
      setTokens((prev) => [t, ...prev]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "링크 발급에 실패했어요.");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(t));
      setCopied(t);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard 미지원 */
    }
  };

  const revoke = async (t: string) => {
    try {
      await fetchWithAuth(`/api/parent/tokens/${t}`, { method: "DELETE" });
      setTokens((prev) => prev.filter((x) => x.token !== t));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "링크 취소에 실패했어요.");
    }
  };

  if (!isPaid) {
    return (
      <Card className="space-y-3 border-prism/20 bg-prism-soft p-6 text-center">
        <p className="text-h3 font-semibold text-foreground">학부모와 공유는 Pro 플랜부터예요</p>
        <p className="text-small text-muted-foreground">
          Pro·Elite에서 자녀의 입시 현황을 학부모님께 view-only 링크로 공유할 수 있어요.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/pricing">요금제 보기</Link>
          </Button>
          <Button asChild variant="secondary">
            <a href="/api/report/sample" target="_blank" rel="noopener noreferrer">
              샘플 리포트 PDF
            </a>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold text-foreground">학부모와 공유</h2>
          <p className="mt-0.5 text-small text-muted-foreground">
            view-only 링크 — 발급 후 7일간 유효, 최대 3개.
          </p>
        </div>
        <Button onClick={generate} disabled={generating} className="shrink-0">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 발급 중
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" aria-hidden /> 새 링크 발급
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-small text-destructive">{error}</p>}

      {loading ? (
        <p className="text-small text-muted-foreground">불러오는 중…</p>
      ) : tokens.length === 0 ? (
        <p className="text-small text-muted-foreground">
          아직 발급한 링크가 없어요. &ldquo;새 링크 발급&rdquo;으로 시작하세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {tokens.map((t) => (
            <li
              key={t.token}
              className="flex items-center gap-2 rounded-md border border-border p-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-small text-muted-foreground">
                {linkFor(t.token)}
              </span>
              <button
                type="button"
                onClick={() => copy(t.token)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="링크 복사"
              >
                {copied === t.token ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden /> 복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden /> 복사
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => revoke(t.token)}
                className="inline-flex items-center rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                aria-label="링크 취소"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
