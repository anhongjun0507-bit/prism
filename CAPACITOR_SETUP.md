# Capacitor 설정 가이드

PRISM 웹앱을 iOS/Android 네이티브 앱으로 빌드하는 가이드입니다.

## 1. Capacitor 패키지 설치

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
```

## 2. RevenueCat 설치 (인앱 결제용)

```bash
npm install @revenuecat/purchases-capacitor
```

## 3. Next.js 정적 export 설정

`next.config.ts`를 다음과 같이 수정:

```typescript
const nextConfig: NextConfig = {
  output: 'export',  // 추가
  images: {
    unoptimized: true,  // 추가 (정적 export에서 필수)
    // ... 기존 설정
  },
  // ... 기존 설정
};
```

**주의**: API 라우트 (`/api/*`)는 정적 export 되지 않습니다. 별도 서버 (Vercel, Cloudflare Workers) 필요.

## 4. Capacitor 초기화

```bash
npx cap init PRISM com.prism.app --web-dir=out
npx cap add ios
npx cap add android
```

## 5. 앱 빌드

```bash
npm run build  # Next.js 정적 export
npx cap sync   # 웹 → 네이티브 동기화
```

## 6. iOS 빌드 (Mac 필요)

```bash
npx cap open ios  # Xcode 실행
```

Xcode에서:
1. Signing & Capabilities → Team 선택 (Apple Developer 계정)
2. Bundle Identifier 확인 (`com.prism.app`)
3. Sign in with Apple capability 추가
4. Build → Run on device or simulator
5. Archive → App Store Connect 업로드

## 7. Android 빌드

```bash
npx cap open android  # Android Studio 실행
```

Android Studio에서:
1. Build → Generate Signed Bundle / APK
2. Keystore 생성 (처음 1회)
3. Release build
4. Google Play Console 업로드

## 8. RevenueCat 통합

`src/lib/iap.ts` 파일 생성:

```typescript
import { Purchases } from '@revenuecat/purchases-capacitor';

const REVENUECAT_API_KEY_IOS = 'appl_xxx';
const REVENUECAT_API_KEY_ANDROID = 'goog_xxx';

export async function initPurchases(userId: string) {
  const isIOS = /* detect platform */;
  await Purchases.configure({
    apiKey: isIOS ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID,
    appUserID: userId,
  });
}

export async function purchasePlan(productId: string) {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    p => p.identifier === productId
  );
  if (pkg) {
    return await Purchases.purchasePackage({ aPackage: pkg });
  }
}

export async function getCustomerInfo() {
  return await Purchases.getCustomerInfo();
}
```

## 9. App Store Connect 상품 등록

1. App Store Connect → 앱 → In-App Purchases → +
2. 자동 갱신 구독 (Auto-Renewable Subscription) 선택
3. 상품 ID:
   - `prism_basic_monthly` (₩9,900)
   - `prism_basic_yearly` (₩79,000)
   - `prism_premium_monthly` (₩19,900)
   - `prism_premium_yearly` (₩149,000)

4. RevenueCat 대시보드에 동일 상품 ID 등록
5. App Store Connect Shared Secret을 RevenueCat에 입력

## 10. Google Play Console 상품 등록

1. Play Console → 앱 → 수익 창출 → 구독 → 구독 만들기
2. 동일 상품 ID 사용
3. RevenueCat에 Google Service Account JSON 업로드

## 11. 푸시 알림 (선택)

```bash
npm install @capacitor/push-notifications
```

Firebase Cloud Messaging 설정 후 사용 가능.

## 자주 발생하는 문제

### "API routes don't work in static export"
→ API 라우트는 별도 서버에서 실행해야 합니다. 옵션:
- Vercel에 백엔드만 배포 (`/api/*`만)
- Cloudflare Workers
- Firebase Functions

### "Image optimization not working"
→ `next.config.ts`에 `images: { unoptimized: true }` 설정

### "Splash screen not showing"
→ `npx cap sync` 실행 후 네이티브 빌드 다시

## 비용 요약

| 항목 | 비용 |
|------|------|
| Apple Developer | $99/년 |
| Google Play | $25 일회성 |
| RevenueCat | 매출 $2,500까지 무료 |
| Vercel (백엔드) | $0 ~ $20/월 |

## 출시 전 체크리스트

- [ ] Apple Developer Program 등록
- [ ] Google Play Developer 등록
- [ ] RevenueCat 계정 + API 키
- [ ] App Store Connect IAP 상품 등록
- [ ] Google Play 구독 상품 등록
- [ ] 앱 아이콘 (1024x1024 PNG)
- [ ] 스크린샷 (각 기기 사이즈)
- [ ] 앱 설명 + 키워드
- [ ] 개인정보 처리방침 URL (Apple 필수)
- [ ] 14세 이상 연령 등급 설정
- [ ] TestFlight 베타 테스트
- [ ] 심사 제출
