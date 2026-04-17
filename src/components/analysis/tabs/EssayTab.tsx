"use client";

import { FileText, Loader2 } from "lucide-react";

interface EssayTabProps {
  schoolName: string;
  displayPrompts: string[] | null;
}

export function EssayTab({ schoolName: _schoolName, displayPrompts }: EssayTabProps) {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-bold">{displayPrompts?.length ?? "…"}개의 에세이 프롬프트</h4>
      </div>
      {displayPrompts === null ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin opacity-60" />
          <p className="text-xs">에세이 프롬프트를 불러오는 중...</p>
        </div>
      ) : displayPrompts.length > 0 ? (
        displayPrompts.map((prompt, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{prompt}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">에세이 프롬프트 정보가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
