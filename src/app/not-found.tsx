import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-headline text-5xl font-black text-primary/80">404</p>
          <h1 className="font-headline text-2xl font-bold">페이지를 찾을 수 없어요</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            주소가 잘못되었거나 삭제된 페이지일 수 있어요.<br />
            대시보드로 돌아가 다시 시도해보세요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/dashboard">
            <Button size="xl" className="w-full gap-2">
              <Home className="w-4 h-4" />
              대시보드로
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="xl" className="w-full">
              시작 화면
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
