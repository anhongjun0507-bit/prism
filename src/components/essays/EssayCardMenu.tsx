"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EssayCardMenuProps {
  essayId: string;
  archived: boolean;
  onArchive: (id: string) => void | Promise<void>;
  onRestore: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

/**
 * 에세이 카드 우상단 ⋯ 메뉴 (사용자 결정 — 보관/복원/삭제).
 *
 *  - 보관/복원: 즉시 실행. updateDoc archived 토글.
 *  - 삭제: Dialog로 확인 → deleteDoc (영구 삭제, 되돌릴 수 없음).
 *
 * AlertDialog primitive 미존재 → 동일 Dialog 컴포넌트로 확인 UI 구성.
 *
 * stopPropagation: 부모 EssayCard가 Link로 감싸지지 않은 영역에 absolute로 배치되므로
 * 별도 propagation 가드 불필요. 메뉴 trigger 자체가 button → 카드 내 Link nav와 분리됨.
 */
export function EssayCardMenu({
  essayId,
  archived,
  onArchive,
  onRestore,
  onDelete,
}: EssayCardMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleArchiveToggle = async () => {
    setBusy(true);
    try {
      if (archived) await onRestore(essayId);
      else await onArchive(essayId);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(essayId);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="에세이 메뉴"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem
            disabled={busy}
            onSelect={() => {
              void handleArchiveToggle();
            }}
          >
            {archived ? (
              <>
                <ArchiveRestore className="h-4 w-4" aria-hidden />
                보관함에서 복원
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" aria-hidden />
                보관함으로 이동
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>에세이를 삭제할까요?</DialogTitle>
            <DialogDescription>
              본문과 모든 첨삭 기록이 영구 삭제돼요. 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
