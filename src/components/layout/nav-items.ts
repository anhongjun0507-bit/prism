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
  MoreHorizontal,
} from "lucide-react";

/**
 * 공유 네비게이션 모델.
 *
 * - BottomNav(모바일)는 `primary` 5개 노출 (마지막 `/more` = 모바일 메뉴).
 * - Sidebar(데스크톱)는 `primary` 중 `/more` 제외 4개 + `tool` 5개 노출
 *   (데스크톱은 사이드바에 도구·설정·테마·로그아웃이 전부 있어 더보기 불필요).
 *
 * `/more`는 모바일에서 도구·설정·테마·로그아웃에 접근하는 메뉴 페이지.
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
  // Primary 5 — BottomNav (Sidebar는 /more 제외 4개)
  { href: "/dashboard", label: "홈", icon: Home, group: "primary" },
  { href: "/analysis", label: "분석", icon: Compass, group: "primary" },
  { href: "/essays", label: "에세이", icon: FileText, group: "primary" },
  { href: "/chat", label: "채팅", icon: MessageCircle, group: "primary" },
  { href: "/more", label: "더보기", icon: MoreHorizontal, group: "primary" },

  // Tool — Sidebar + 모바일 /more 메뉴
  { href: "/what-if", label: "What-If", icon: SlidersHorizontal, group: "tool" },
  { href: "/spec-analysis", label: "스펙 분석", icon: Sparkles, group: "tool" },
  { href: "/planner", label: "플래너", icon: Calendar, group: "tool" },
  { href: "/compare", label: "비교", icon: GitCompare, group: "tool" },
  { href: "/parent-report", label: "학부모 리포트", icon: Users, group: "tool" },
] as const;

export const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.group === "primary");
export const TOOL_ITEMS = NAV_ITEMS.filter((item) => item.group === "tool");
