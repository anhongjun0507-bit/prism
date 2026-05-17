"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Toast v3 — 우상단, 4초 자동 dismiss, 액션 가능. 브리프 §구현 원칙 9. */
export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  [
    "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
    "rounded-ds-card p-4 pr-10 shadow-ds-elevated border",
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ds-bg-surface)] border-[color:var(--ds-border-subtle)] text-[color:var(--ds-text-primary)]",
        success:
          "bg-[color:var(--ds-safety-soft)] border-[color:var(--ds-safety)]/30 text-[color:var(--ds-safety)]",
        warning:
          "bg-[color:var(--ds-hard-soft)] border-[color:var(--ds-hard)]/30 text-[color:var(--ds-hard)]",
        danger:
          "bg-[color:var(--ds-reach-soft)] border-[color:var(--ds-reach)]/30 text-[color:var(--ds-reach)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    duration={4000}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-ds-body-md font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-ds-body-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-ds-input px-3 text-ds-body-sm font-medium",
      "border border-current/30 hover:bg-current/10 transition-colors",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="닫기"
    className={cn("absolute right-2 top-2 rounded-sm opacity-60 hover:opacity-100 transition-opacity", className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;
