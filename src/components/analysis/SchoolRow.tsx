"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import type { School } from "@/lib/matching";
import { SchoolLogo } from "@/components/SchoolLogo";
import { CAT_STYLE, probGradientStyle } from "@/lib/analysis-helpers";
import { haptic } from "@/hooks/use-haptic";
import type { RowComponentProps } from "react-window";

export type SchoolRowData = {
  filtered: School[];
  onSelect: (s: School) => void;
  onToggleFavorite: (name: string) => void;
  isFavorite: (name: string) => boolean;
};

/**
 * react-window용 가상화 학교 행.
 * 잠긴 학교는 서버에서 응답 자체에서 제외 → 클라이언트는 모두 unlocked로 가정.
 * "잠금 오버레이" UI는 더 이상 필요 없음 (DOM에 데이터 없음 = 우회 불가).
 */
export const SchoolRow = ({
  index, style, filtered, onSelect, onToggleFavorite, isFavorite,
}: RowComponentProps<SchoolRowData>) => {
  const school = filtered[index];
  if (!school) return null;
  const catStyle = CAT_STYLE[school.cat || "Reach"];
  const fav = isFavorite(school.n);
  return (
    <div style={style} className="px-6 pb-2.5">
      <button className="w-full text-left" onClick={() => onSelect(school)} aria-label={`${school.n} 상세 보기`}>
        <Card
          variant="elevated"
          interactive
          className="p-0 overflow-hidden group relative"
        >
          {/* Left edge accent — school 색 띠로 brand identity */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
            style={{ backgroundColor: school.c }}
            aria-hidden="true"
          />
          <div className="flex items-center gap-3 p-4 pl-5">
            <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-bold text-sm truncate">{school.n}</p>
                <Badge className={`${catStyle.bg} border-none text-xs shrink-0 px-1.5 font-bold`}>{school.cat}</Badge>
              </div>
              {/* Probability bar with depth — track shows muted, fill is school color gradient */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 h-2.5 bg-muted rounded-full overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${school.prob || 0}%`, ...probGradientStyle(school.prob || 0) }}
                  />
                  {/* subtle highlight for glossy feel */}
                  <div
                    className="absolute top-0 left-0 h-1/2 rounded-t-full bg-white/20 transition-all duration-500"
                    style={{ width: `${school.prob || 0}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color: school.c }}>
                  {school.prob}%
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>SAT {school.sat[0] > 0 || school.sat[1] > 0 ? `${school.sat[0]}–${school.sat[1]}` : "N/A"}</span>
                <span>GPA {school.gpa > 0 ? school.gpa : "N/A"}</span>
                {school.tuition && <span>${(school.tuition / 1000).toFixed(0)}k</span>}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); haptic("light"); onToggleFavorite(school.n); }}
              className="shrink-0 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label={fav ? `${school.n} 즐겨찾기 해제` : `${school.n} 즐겨찾기 추가`}
              aria-pressed={fav}
            >
              <Heart className={`w-4 h-4 transition-all ${fav ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground/40"}`} />
            </button>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Card>
      </button>
    </div>
  );
};
