import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "설정 · PRISM",
  description: "계정·플랜·테마를 관리하세요.",
};

export default function SettingsPage() {
  return (
    <>
      <Topbar title="설정" />
      <SettingsClient />
    </>
  );
}
