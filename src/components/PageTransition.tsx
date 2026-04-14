"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

/**
 * PageTransition — directional slide based on navigation depth.
 *
 * 깊이 비교:
 *   - 새 경로 segments가 더 많음 → drill-down (slide from right)
 *   - 새 경로 segments가 더 적음 → drill-back (slide from left)
 *   - 같은 깊이 → fade (sibling navigation)
 *
 * 최상위 (/) ↔ 대시보드 같은 lateral 이동도 fade로 fallback.
 */

type Direction = "forward" | "back" | "lateral";

function depth(pathname: string): number {
  return pathname.split("/").filter(Boolean).length;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [direction, setDirection] = useState<Direction>("lateral");
  const [animKey, setAnimKey] = useState(0);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      const prevDepth = depth(prevPathname.current);
      const newDepth = depth(pathname);
      const dir: Direction =
        newDepth > prevDepth ? "forward" :
        newDepth < prevDepth ? "back" :
        "lateral";

      prevPathname.current = pathname;
      setDirection(dir);
      setDisplayChildren(children);
      // Bump key so animation restarts even when direction unchanged.
      setAnimKey((k) => k + 1);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  const animClass =
    direction === "forward" ? "animate-page-forward" :
    direction === "back" ? "animate-page-back" :
    "animate-page-enter";

  return (
    <div key={animKey} className={animClass}>
      {displayChildren}
    </div>
  );
}
