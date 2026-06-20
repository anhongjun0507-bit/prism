import type { LucideIcon } from "lucide-react";
import {
  Home,
  Compass,
  FileText,
  MessageCircle,
  MoreHorizontal,
  SlidersHorizontal,
  Sparkles,
  Calendar,
  GitCompare,
} from "lucide-react";

/**
 * 공유 네비게이션 모델.
 *
 * - BottomNav(모바일)는 `primary` 5개 노출.
 * - Sidebar(데스크톱)는 `primary` 중 `/more`를 제외한 4개 + `tool` 4개 노출
 *   (가이드 §글로벌 UI: "Sidebar는 Tool 4개를 펼쳐 보여주므로 '더보기' 개념 자체가 없음").
 *
 * 데이터+아이콘 참조만 export하므로 Server Component에서도 import 가능 — 'use client' 불필요.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "primary" | "tool";
}

export const NAV_ITEMS: readonly NavItem[] = [
  // Primary 5 — BottomNav + Sidebar 상단
  { href: "/dashboard", label: "홈", icon: Home, group: "primary" },
  { href: "/analysis", label: "분석", icon: Compass, group: "primary" },
  { href: "/essays", label: "에세이", icon: FileText, group: "primary" },
  { href: "/chat", label: "채팅", icon: MessageCircle, group: "primary" },
  { href: "/more", label: "더보기", icon: MoreHorizontal, group: "primary" },

  // Tool 4 — Sidebar 전용
  { href: "/what-if", label: "What-If", icon: SlidersHorizontal, group: "tool" },
  { href: "/spec-analysis", label: "스펙 분석", icon: Sparkles, group: "tool" },
  { href: "/planner", label: "플래너", icon: Calendar, group: "tool" },
  { href: "/compare", label: "비교", icon: GitCompare, group: "tool" },
] as const;

export const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.group === "primary");
export const TOOL_ITEMS = NAV_ITEMS.filter((item) => item.group === "tool");
