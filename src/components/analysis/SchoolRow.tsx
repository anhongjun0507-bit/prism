"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import type { School } from "@/lib/matching";
import { SchoolLogo } from "@/components/SchoolLogo";
import { CAT_STYLE, probGradient } from "@/lib/analysis-helpers";
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
  return (
    <div style={style} className="px-6 pb-2.5">
      <button className="w-full text-left" onClick={() => onSelect(school)} aria-label={`${school.n} 상세 보기`}>
        <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow-md transition-all p-0 overflow-hidden group relative">
          <div className="flex items-center gap-3 p-4">
            <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm truncate">{school.n}</p>
                <Badge className={`${catStyle.bg} border-none text-xs shrink-0 px-1.5`}>{school.cat}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${probGradient(school.prob || 0)} transition-all`}
                    style={{ width: `${school.prob || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: school.c }}>
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
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(school.n); }}
              className="shrink-0 p-1"
              aria-label="즐겨찾기"
            >
              <Heart className={`w-4 h-4 ${isFavorite(school.n) ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`} />
            </button>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </div>
        </Card>
      </button>
    </div>
  );
};
