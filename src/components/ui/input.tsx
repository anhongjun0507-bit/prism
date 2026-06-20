import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PRISM Input — 토스 입력박스 톤. height 44px(h-11), rounded-md(10px).
 * 에러 상태는 aria-invalid="true"로 표시 (외부 빨간 텍스트는 사용처에서 처리).
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-body placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-small file:font-medium",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
