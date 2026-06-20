"use client";

import { useEffect, useState } from "react";

/**
 * useDebouncedValue — value가 delay만큼 안정되어야 새 값을 반환.
 *
 * 슬라이더처럼 빠르게 변하는 입력에 대해 fetch·계산을 제한하기 위함.
 * /what-if 페이지에서 specs 변경 → 500ms 후 /api/match 호출에 사용.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
