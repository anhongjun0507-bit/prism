"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/ThemeProvider";

/**
 * 라이트/다크 테마 토글.
 *
 * 아이콘 스왑은 `.dark` 클래스 기반 Tailwind variant로 처리해 첫 페인트 깜빡임이 없다
 * (pre-hydration 스크립트가 React 마운트 전에 `.dark`를 이미 붙여둠 — app/layout.tsx 참조).
 * 따라서 `theme` state는 onClick에서만 읽고 JSX 분기에는 쓰지 않는다.
 *
 * TooltipProvider는 ancestor에 마운트돼 있어야 한다((public)/(app) layout에서 제공).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          shape="pill"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="테마 전환"
        >
          <Sun className="h-5 w-5 dark:hidden" aria-hidden />
          <Moon className="hidden h-5 w-5 dark:block" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">테마 전환</TooltipContent>
    </Tooltip>
  );
}
