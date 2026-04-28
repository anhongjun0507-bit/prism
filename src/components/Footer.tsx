import Link from "next/link";
import { getBusinessInfo } from "@/lib/business-info";

export function Footer() {
  const biz = getBusinessInfo();

  return (
    <footer
      role="contentinfo"
      className="border-t border-border/60 bg-muted/20 mt-section-lg"
    >
      <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto px-gutter-sm md:px-gutter py-section">
        {biz.isPlaceholder && process.env.NODE_ENV !== "production" && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"
          >
            ⚠️ 사업자 정보가 placeholder입니다. 배포 전 환경변수(NEXT_PUBLIC_BIZ_*)에 실제 정보를 입력하세요.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-3 text-foreground">서비스</h3>
            <ul className="space-y-2 text-foreground/70">
              <li><Link href="/" className="hover:text-foreground">홈</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">요금제</Link></li>
              <li><Link href="/sample-report" className="hover:text-foreground">샘플 리포트</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-foreground">고객지원</h3>
            <ul className="space-y-2 text-foreground/70">
              <li>
                <a href={`mailto:${biz.email}`} className="hover:text-foreground break-all">
                  문의: {biz.email}
                </a>
              </li>
              {biz.phone && (
                <li>
                  <a href={`tel:${biz.phone}`} className="hover:text-foreground">
                    전화: {biz.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-foreground">법적 고지</h3>
            <ul className="space-y-2 text-foreground/70">
              <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
              <li><Link href="/refund" className="hover:text-foreground">환불정책</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-foreground">개인정보</h3>
            <ul className="space-y-2 text-foreground/70">
              <li>책임자: {biz.privacyOfficer}</li>
              <li>
                <a href={`mailto:${biz.privacyOfficerEmail}`} className="hover:text-foreground break-all">
                  {biz.privacyOfficerEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-xs text-foreground/60 space-y-1.5 leading-relaxed">
          <p>
            <span className="mr-3">상호: {biz.name}</span>
            <span className="mr-3">대표: {biz.representative}</span>
            <span>사업자등록번호: {biz.registrationNumber}</span>
          </p>
          <p>
            <span className="mr-3">통신판매업신고: {biz.telecomNumber}</span>
            <span>주소: {biz.address}</span>
          </p>
          <p className="pt-1.5">
            © {new Date().getFullYear()} {biz.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
