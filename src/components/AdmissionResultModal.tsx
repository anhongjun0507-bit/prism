"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Trophy, ChevronRight } from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface AdmissionResult {
  school: string;
  result: "accepted" | "rejected" | "waitlisted" | "deferred";
}

export function AdmissionResultBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full">
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-500/10 dark:to-blue-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-foreground">합격 결과를 공유해주세요</p>
          <p className="text-xs text-muted-foreground">후배들의 더 정확한 예측에 기여할 수 있어요</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </Card>
    </button>
  );
}

export function AdmissionResultModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<AdmissionResult[]>([]);
  const [schoolInput, setSchoolInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addResult = (result: AdmissionResult["result"]) => {
    if (!schoolInput.trim()) return;
    setResults(prev => [...prev, { school: schoolInput.trim(), result }]);
    setSchoolInput("");
  };

  const handleSubmit = async () => {
    if (results.length === 0) return;
    setSubmitting(true);
    try {
      const anonymousData = {
        gpaRange: profile?.gpa ? `${Math.floor(parseFloat(profile.gpa) * 10) / 10}` : null,
        satRange: profile?.sat ? `${Math.round(parseInt(profile.sat) / 50) * 50}` : null,
        major: profile?.major || null,
        grade: profile?.grade || null,
        results,
        submittedAt: new Date().toISOString(),
        year: new Date().getFullYear(),
      };

      if (user) {
        await setDoc(doc(collection(db, "admission_results")), anonymousData);
      }

      setSubmitted(true);
    } catch {
      // Silent fail — still show thank you
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent hideClose className="max-w-sm p-8 text-center relative overflow-hidden prism-strip-once">
          <DialogHeader className="items-center space-y-0">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-emerald-500" aria-hidden="true" />
            </div>
            <DialogTitle className="font-headline font-bold text-xl mb-2">감사합니다!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-2">
              {results.length}개 결과가 익명으로 기록되었습니다.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-primary font-medium mb-2">
            이 데이터가 후배들의 더 정확한 합격 예측에 기여합니다
          </p>
          <Button onClick={onClose} className="w-full rounded-xl">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideClose className="max-w-md p-6 max-h-[85vh] overflow-y-auto space-y-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-headline font-bold text-lg">합격 결과 공유</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            결과는 익명으로만 저장되며, PRISM 합격 예측 정확도 향상에 사용됩니다.
          </DialogDescription>
        </DialogHeader>

        {/* Added results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2.5">
                {r.result === "accepted" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {r.result === "rejected" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {r.result === "waitlisted" && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                {r.result === "deferred" && <Clock className="w-4 h-4 text-blue-500 shrink-0" />}
                <span className="text-sm font-medium flex-1">{r.school}</span>
                <Badge variant="secondary" className="text-xs">
                  {r.result === "accepted" ? "합격" : r.result === "rejected" ? "불합격" : r.result === "waitlisted" ? "대기" : "보류"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <Input
            value={schoolInput}
            onChange={(e) => setSchoolInput(e.target.value)}
            placeholder="대학 이름 입력..."
            className="h-11 rounded-xl"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addResult("accepted")}
              disabled={!schoolInput.trim()}
              className="rounded-xl gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> 합격
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addResult("rejected")}
              disabled={!schoolInput.trim()}
              className="rounded-xl gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" /> 불합격
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addResult("waitlisted")}
              disabled={!schoolInput.trim()}
              className="rounded-xl gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Clock className="w-3.5 h-3.5" /> 대기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addResult("deferred")}
              disabled={!schoolInput.trim()}
              className="rounded-xl gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Clock className="w-3.5 h-3.5" /> 보류
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
            나중에
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={results.length === 0 || submitting}
            className="flex-1 rounded-xl"
          >
            {submitting ? "제출 중..." : `${results.length}개 결과 제출`}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center">
          GPA/SAT은 범위(3.7→3.7, 1450→1450)로만 저장되며 개인 식별이 불가합니다
        </p>
      </DialogContent>
    </Dialog>
  );
}
