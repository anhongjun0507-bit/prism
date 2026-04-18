/**
 * Firebase Admin SDK — 서버 사이드 단일 진입점.
 *
 * 모든 API 라우트에서 이 파일의 helper를 통해 Admin SDK에 접근하세요.
 * 직접 firebase-admin을 import하여 initializeApp을 중복 호출하지 마세요.
 *
 * 환경변수:
 *   FIREBASE_ADMIN_PROJECT_ID    — 서비스 계정 project_id
 *   FIREBASE_ADMIN_CLIENT_EMAIL  — 서비스 계정 client_email
 *   FIREBASE_ADMIN_PRIVATE_KEY   — 서비스 계정 private_key (개행 \\n 이스케이프 OK)
 *
 * 셋이 모두 없으면 NEXT_PUBLIC_FIREBASE_PROJECT_ID로 폴백 (Application Default
 * Credentials — Cloud Run/Firebase Hosting 환경에서만 동작).
 */
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { validateServerEnv } from "./env";

let cachedApp: App | null = null;

function getApp(): App {
  // 첫 Admin SDK 접근 시 env 검증도 함께 수행(한 번만). 하드 페일하지 않음.
  validateServerEnv();
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && projectId) {
    cachedApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else if (projectId) {
    // ADC 폴백 (Cloud Run / Firebase Hosting / gcloud auth application-default login)
    try {
      cachedApp = initializeApp({ credential: applicationDefault(), projectId });
    } catch {
      cachedApp = initializeApp({ projectId });
    }
  } else {
    throw new Error("Firebase Admin SDK 초기화 실패: project ID가 없습니다. FIREBASE_ADMIN_PROJECT_ID 또는 NEXT_PUBLIC_FIREBASE_PROJECT_ID 설정 필요.");
  }
  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getApp());
}
