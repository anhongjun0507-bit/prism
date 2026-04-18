"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, RotateCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  /** compact=true: 인라인 카드 폴백 (부분 트리용). 기본 false는 전체 화면 폴백(루트 레이아웃용). */
  compact?: boolean;
  /** 로그 필터링용 식별자 (어느 영역에서 터졌는지) */
  tag?: string;
  /** 완전 커스텀 폴백 렌더. 주어지면 compact/기본 UI 무시. */
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 구조화 로그 — 어느 영역(tag)에서 터졌는지 운영에서 즉시 파악 가능.
    console.error(
      JSON.stringify({
        type: "error_boundary",
        tag: this.props.tag || "root",
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 5).join(" | "),
      })
    );
    // Send to Sentry if available (SDK injects global.Sentry when initialized)
    if (typeof window !== "undefined") {
      const w = window as Window & {
        Sentry?: { captureException?: (err: unknown, ctx?: unknown) => void };
      };
      if (w.Sentry?.captureException) {
        w.Sentry.captureException(error, { extra: { ...errorInfo, tag: this.props.tag } });
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.handleReset, this.state.error);
      }
      if (this.props.compact) {
        return (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-5 text-center space-y-3">
            <div className="flex justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">이 영역을 표시하지 못했어요</p>
              <p className="text-xs text-muted-foreground">
                일시적 오류일 수 있어요. 다시 시도하거나 새로고침해 주세요.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              <RotateCw className="w-3.5 h-3.5" />
              다시 시도
            </button>
          </div>
        );
      }
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-headline text-2xl font-bold">앗, 문제가 발생했어요</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                예상치 못한 오류가 발생했습니다.<br />
                잠시 후 다시 시도해주세요.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-muted/50 rounded-xl p-3 text-left">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={this.handleReset} size="xl" className="w-full gap-2">
                <RotateCw className="w-4 h-4" />
                다시 시도
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="xl" className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  홈으로
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground/70">
              문제가 계속되면 support@prism-app.com 으로 알려주세요.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
