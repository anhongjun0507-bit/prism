import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder-app-id",
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
