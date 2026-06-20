"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO } from "@/lib/date";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/task-categories";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { title: string; category: TaskCategory; dueDate: string }) => void;
}

export function AddTaskDialog({ open, onOpenChange, onAdd }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("기타");
  const [dueDate, setDueDate] = useState(todayISO());

  useEffect(() => {
    if (!open) {
      setTitle("");
      setCategory("기타");
      setDueDate(todayISO());
    }
  }, [open]);

  const canSubmit = title.trim().length > 0 && !!dueDate;
  const submit = () => {
    if (!canSubmit) return;
    onAdd({ title: title.trim(), category, dueDate });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>할 일 추가</DialogTitle>
          <DialogDescription>제목·카테고리·마감일을 입력해 새 할 일을 추가해요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-small">제목</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: Common App Prompt 1 초안"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-small">카테고리</Label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-caption transition-colors",
                    category === c
                      ? "border-primary bg-prism-soft text-prism"
                      : "border-border text-muted-foreground hover:border-primary",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due" className="text-small">마감일</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit} disabled={!canSubmit}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
