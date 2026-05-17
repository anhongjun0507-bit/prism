import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input v3 — radius 12 (브리프 §Radius), bg-subtle, hover/focus 보더 강화.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-ds-input bg-[color:var(--ds-bg-subtle)] px-4 text-ds-body-md",
        "text-[color:var(--ds-text-primary)] placeholder:text-[color:var(--ds-text-tertiary)]",
        "border border-transparent transition-colors duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
        "hover:border-[color:var(--ds-border-default)]",
        "focus-visible:outline-none focus-visible:border-[color:var(--ds-brand-primary)] focus-visible:bg-[color:var(--ds-bg-surface)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-ds-body-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-ds-input bg-[color:var(--ds-bg-subtle)] px-4 py-3 text-ds-body-md",
        "text-[color:var(--ds-text-primary)] placeholder:text-[color:var(--ds-text-tertiary)]",
        "border border-transparent transition-colors duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
        "hover:border-[color:var(--ds-border-default)]",
        "focus-visible:outline-none focus-visible:border-[color:var(--ds-brand-primary)] focus-visible:bg-[color:var(--ds-bg-surface)]",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
