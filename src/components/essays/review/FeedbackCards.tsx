import { AlertTriangle, Check, Lightbulb } from "lucide-react";
import { AIBlock } from "@/components/prism/ai-block";
import { cn } from "@/lib/utils";

interface FeedbackCardsProps {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const SECTIONS = [
  { key: "strengths", title: "강점", icon: Check, accent: "text-success" },
  { key: "weaknesses", title: "약점", icon: AlertTriangle, accent: "text-warning" },
  { key: "suggestions", title: "개선 제안", icon: Lightbulb, accent: "text-prism" },
] as const;

/** 강점/약점/개선 제안 — 각 string[]을 AIBlock(card) 리스트로. 빈 섹션은 숨김. */
export function FeedbackCards({
  strengths,
  weaknesses,
  suggestions,
}: FeedbackCardsProps) {
  const map = { strengths, weaknesses, suggestions };
  return (
    <div className="space-y-3">
      {SECTIONS.map(({ key, title, icon: Icon, accent }) => {
        const items = map[key];
        if (!items || items.length === 0) return null;
        return (
          <AIBlock key={key} variant="card" className="p-4">
            <p className="flex items-center gap-1.5 text-small font-semibold text-foreground">
              <Icon className={cn("h-4 w-4", accent)} aria-hidden />
              {title}
            </p>
            <ul className="mt-2 space-y-1.5">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-small leading-relaxed text-foreground"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                    aria-hidden
                  />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </AIBlock>
        );
      })}
    </div>
  );
}
