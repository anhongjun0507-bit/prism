"use client";

import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Search, MapPin, Users, Trophy, ExternalLink,
} from "lucide-react";
import type { School } from "@/lib/matching";

interface MajorTabProps {
  school: School;
}

export function MajorTab({ school }: MajorTabProps) {
  const majorEntries = Object.entries(school.mr || {}).sort((a, b) => a[1] - b[1]);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-bold">전공 랭킹</h4>
      </div>
      {majorEntries.length > 0 ? (
        <div className="space-y-2">
          {majorEntries.map(([major, rank]) => (
            <div key={major} className="flex items-center gap-3 bg-accent/30 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                rank <= 3 ? "bg-amber-100 text-amber-700" :
                rank <= 10 ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                #{rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{major}</p>
                <p className="text-xs text-muted-foreground">
                  {rank <= 3 ? "전미 최상위" : rank <= 10 ? "전미 Top 10" : rank <= 25 ? "우수" : "경쟁력 있음"}
                </p>
              </div>
              <div className="w-16">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rank <= 3 ? "bg-amber-500" : rank <= 10 ? "bg-blue-500" : "bg-gray-400"
                    }`}
                    style={{ width: `${Math.max(10, 100 - rank * 2)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-4 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">전공별 세부 랭킹 데이터가 아직 수집되지 않았어요</p>
            <p className="text-xs mt-1">학교 공식 웹사이트에서 전공 정보를 확인해보세요</p>
          </div>
          {school.d && (
            <a
              href={`https://${school.d}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-xl py-3 text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {school.n} 공식 웹사이트
            </a>
          )}
        </div>
      )}

      {/* School Info */}
      {(school.size || school.setting || school.tp) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 정보</h4>
          <div className="grid grid-cols-2 gap-2">
            {(school.size ?? 0) > 0 && (
              <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">학부 규모</p>
                  <p className="text-sm font-semibold">{school.size!.toLocaleString()}명</p>
                </div>
              </div>
            )}
            {(school.tuition ?? 0) > 0 && (
              <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">연간 등록금</p>
                  <p className="text-sm font-semibold">${(school.tuition! / 1000).toFixed(0)}k</p>
                </div>
              </div>
            )}
            {school.setting && (
              <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">캠퍼스 환경</p>
                  <p className="text-sm font-semibold">{school.setting}</p>
                </div>
              </div>
            )}
            {school.loc && (
              <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">위치</p>
                  <p className="text-sm font-semibold">{school.loc}</p>
                </div>
              </div>
            )}
          </div>
          {school.tp && (
            <div className="bg-accent/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">한 줄 소개</p>
              <p className="text-sm leading-relaxed">{school.tp}</p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {school.tg.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 특성</h4>
          <div className="flex flex-wrap gap-1.5">
            {school.tg.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs rounded-lg px-3 py-1">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
