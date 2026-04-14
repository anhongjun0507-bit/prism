import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // 테스트는 src 안의 *.test.ts(x) 또는 __tests__ 디렉토리만
    include: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    // Next.js 빌드 산출물·스크립트 등은 제외
    exclude: ["node_modules/**", ".next/**", "out/**", "scripts/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/app/api/**"],
    },
  },
  resolve: {
    // tsconfig.json의 path alias를 native로 인식
    tsconfigPaths: true,
    alias: {
      // server-only 패키지는 클라이언트에서 import 차단용. 테스트(Node)에선 무해한 빈 모듈로 대체.
      "server-only": resolve(__dirname, "vitest.server-only-stub.ts"),
    },
  },
});
