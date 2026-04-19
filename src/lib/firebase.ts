import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// env 누락 검출. 프로덕션에서는 로그인·DB가 동작할 수 없으므로 빌드/부팅 즉시 throw —
// placeholder로 조용히 초기화된 뒤 런타임에 "로그인 실패" 같은 모호한 증상으로 나타나는 것을 방지.
// 개발 환경에서는 placeholder로 폴백해 로컬에서 env 없이도 UI 실험 가능.
const requiredEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(requiredEnv)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0 && process.env.NODE_ENV === "production") {
  throw new Error(
    `Firebase 환경변수가 설정되지 않았습니다: ${missing.join(", ")}. ` +
    `Vercel/배포 환경의 NEXT_PUBLIC_FIREBASE_* 키를 확인해주세요.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnv.apiKey || "placeholder-api-key",
  authDomain: requiredEnv.authDomain || "placeholder-auth-domain",
  projectId: requiredEnv.projectId || "placeholder-project-id",
  storageBucket: requiredEnv.storageBucket || "placeholder-storage-bucket",
  messagingSenderId: requiredEnv.messagingSenderId || "placeholder-sender-id",
  appId: requiredEnv.appId || "placeholder-app-id",
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];

// ignoreUndefinedProperties: Firestore는 기본적으로 undefined 필드 포함 문서를 거부.
// 에세이 첨삭(EssayReview.tone/keyChange/... optional), wordLimit 등이 undefined로 들어오면
// setDoc이 throw되어 Firestore 쓰기가 실패 → 사용자에게 "저장 안 됨" 버그로 나타남.
// initializeFirestore는 app 최초 생성 시 한 번만 호출 가능 (HMR 재초기화 방지).
export const db = isNewApp
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
appleProvider.setCustomParameters({ locale: 'ko' });
export const emailProvider = new EmailAuthProvider();
