import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { EssaysClient } from "./EssaysClient";

export const metadata: Metadata = {
  title: "에세이 · PRISM",
  description:
    "지원 대학별 에세이를 작성하고, 입학사정관 관점의 AI 첨삭을 받아보세요.",
};

export default function EssaysPage() {
  return (
    <>
      <Topbar title="에세이" />
      <EssaysClient />
    </>
  );
}
