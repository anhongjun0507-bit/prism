"use client";

import { AlertTriangle, Trash2, Info } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * AlertDialog 공통 랩퍼. 대화 리셋·로그아웃·삭제 같이 3단계 UI가 반복되는 곳에서 사용.
 *
 * variant 분기:
 * - "default": 정보성 확인 (예: 다음 단계 진행)
 * - "warning": 주의 필요 (예: 구독 해지, 되돌릴 수 있는 액션)
 * - "destructive": 위험 (예: 영구 삭제, 토큰 취소) — red CTA + Trash 아이콘
 *
 * 의도적으로 본체 ui/alert-dialog의 primitives를 재노출하지 않음 — ConfirmDialog로
 * 처리 불가한 커스텀(포커스 트랩, 중첩 dialog 등)은 여전히 primitives를 직접 쓸 수 있음.
 */
type ConfirmVariant = "default" | "warning" | "destructive";

const VARIANT_STYLES: Record<ConfirmVariant, {
  icon: typeof Info;
  iconClass: string;
  iconBgClass: string;
  ctaClass: string;
}> = {
  default: {
    icon: Info,
    iconClass: "text-primary",
    iconBgClass: "bg-primary/10",
    ctaClass: "",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    iconBgClass: "bg-amber-100 dark:bg-amber-950/40",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600",
  },
  destructive: {
    icon: Trash2,
    iconClass: "text-red-600 dark:text-red-400",
    iconBgClass: "bg-red-100 dark:bg-red-950/40",
    ctaClass: "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-500",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  variant,
  destructive = false,
  confirmDisabled = false,
  hideIcon = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmVariant;
  /** @deprecated variant="destructive" 사용 권장 — 하위 호환을 위해 유지. */
  destructive?: boolean;
  confirmDisabled?: boolean;
  hideIcon?: boolean;
}) {
  const resolvedVariant: ConfirmVariant = variant ?? (destructive ? "destructive" : "default");
  const style = VARIANT_STYLES[resolvedVariant];
  const Icon = style.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center sm:items-start">
          {!hideIcon && (
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center mb-1",
              style.iconBgClass,
            )}>
              <Icon className={cn("w-5 h-5", style.iconClass)} aria-hidden="true" />
            </div>
          )}
          <AlertDialogTitle className="text-lg text-balance break-keep-all">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm leading-relaxed text-balance break-keep-all">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl min-h-[44px]">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={cn(
              "rounded-xl min-h-[44px]",
              style.ctaClass,
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
