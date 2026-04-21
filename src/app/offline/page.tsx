import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "오프라인",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <WifiOff className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold mb-2">오프라인이에요</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        네트워크 연결이 끊겨서 이 페이지를 불러올 수 없어요.
        <br />
        연결이 돌아오면 다시 시도해주세요.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold"
      >
        홈으로
      </Link>
    </div>
  );
}
