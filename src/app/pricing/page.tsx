import type { Metadata } from "next";
import { PricingClient } from "./PricingClient";

export const metadata: Metadata = {
  title: "요금제 · PRISM",
  description:
    "PRISM Free·Pro·Elite 요금제 — 대치동 컨설팅 1회 가격으로 한 달 내내 무제한 입시 관리.",
};

/**
 * 요금제 (가이드 §15). 라우트 /pricing — 최상위(로그인 없이 열람 가능, (app) 그룹 밖).
 * 결제는 Toss 연동(웹). 구매만 인증 필요.
 */
export default function PricingPage() {
  return <PricingClient />;
}
