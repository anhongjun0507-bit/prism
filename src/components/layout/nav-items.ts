import type { LucideIcon } from "lucide-react";
import {
  Home,
  Compass,
  FileText,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  Calendar,
  GitCompare,
  Users,
} from "lucide-react";

/**
 * 공유 네비게이션 모델.
 *
 * - BottomNav(모바일)는 `primary` 4개 노출.
 * - Sidebar(데스크톱)는 `primary` 4개 + `tool` 4개 노출.
 *
 * 데모 정리: 콘텐츠 미정인 `/more` 스텁 탭을 진입점(BottomNav)에서 제거.
 * 페이지 파일(`src/app/(app)/more/page.tsx`)은 삭제하지 않고 보존.
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
  // Primary 4 — BottomNav + Sidebar 상단
  { href: "/dashboard", label: "홈", icon: Home, group: "primary" },
  { href: "/analysis", label: "분석", icon: Compass, group: "primary" },
  { href: "/essays", label: "에세이", icon: FileText, group: "primary" },
  { href: "/chat", label: "채팅", icon: MessageCircle, group: "primary" },

  // Tool — Sidebar 전용
  { href: "/what-if", label: "What-If", icon: SlidersHorizontal, group: "tool" },
  { href: "/spec-analysis", label: "스펙 분석", icon: Sparkles, group: "tool" },
  { href: "/planner", label: "플래너", icon: Calendar, group: "tool" },
  { href: "/compare", label: "비교", icon: GitCompare, group: "tool" },
  { href: "/parent-report", label: "학부모 리포트", icon: Users, group: "tool" },
] as const;

export const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.group === "primary");
export const TOOL_ITEMS = NAV_ITEMS.filter((item) => item.group === "tool");
