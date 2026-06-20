"use client";

/**
 * Essay CRUD 헬퍼 — 클라이언트 SDK 직접 호출.
 *
 * /api/essays/* CRUD 라우트는 없음. Firestore rules가 users/{uid}/essays/{id}에
 * `request.auth.uid == uid` 권한 검증을 직접 처리하므로 API 경유 불필요.
 *
 * AI 산출물(outline·review)은 별도 /api/essay-outline, /api/essay-review가 담당.
 *
 * Firestore는 client에서 initializeFirestore({ignoreUndefinedProperties:true})로
 * 초기화돼 있어 wordLimit 등 optional 필드가 undefined여도 안전.
 */

import { collection, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { countWords } from "./essay-utils";
import type { Essay, EssayVersion, EssayReview } from "@/types/essay";

export interface CreateEssayParams {
  university: string;
  prompt: string;
  wordLimit?: number;
}

/**
 * 새 에세이 생성 — `crypto.randomUUID()`로 ID 부여 후 Firestore에 setDoc.
 * 반환값은 새로 생성된 essay id.
 */
export async function createEssay(
  uid: string,
  params: CreateEssayParams,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const essay: Omit<Essay, "id"> = {
    university: params.university,
    prompt: params.prompt,
    content: "",
    lastSaved: today,
    updatedAt: now,
    wordLimit: params.wordLimit,
    versions: [],
    reviews: [],
    archived: false,
  };

  await setDoc(doc(collection(db, "users", uid, "essays"), id), essay);
  return id;
}

/** 보관함으로 이동 — archived=true + archivedAt 기록. */
export async function archiveEssay(uid: string, id: string): Promise<void> {
  await updateDoc(doc(db, "users", uid, "essays", id), {
    archived: true,
    archivedAt: new Date().toISOString(),
  });
}

/**
 * 보관함에서 복원 — archived=false로 토글. archivedAt 필드는 의미 없어지지만
 * deleteField 호출은 생략(주석에 "archived=true일 때만 의미"라고 명시돼 있어 stale OK).
 */
export async function restoreEssay(uid: string, id: string): Promise<void> {
  await updateDoc(doc(db, "users", uid, "essays", id), {
    archived: false,
  });
}

/** 영구 삭제 — Firestore document 자체 제거. */
export async function deleteEssay(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "essays", id));
}

/* ──────────────────────────────────────────────────────────
   에디터(/essays/review/[id]) 전용 — content/version/review 저장
   ────────────────────────────────────────────────────────── */

/** 버전 히스토리 최대 보관 개수 — 초과 시 오래된 것부터 제거. */
const MAX_VERSIONS = 10;
/** 첨삭 결과 최대 보관 개수 — 최신이 [0]. */
const MAX_REVIEWS = 5;

/**
 * 자동 저장 — 본문만 갱신(버전은 만들지 않음). lastSaved(YYYY-MM-DD)·updatedAt(ISO)을
 * 함께 갱신해 목록 정렬(updatedAt desc)·표시(lastSaved)에 반영.
 */
export async function updateEssayContent(
  uid: string,
  id: string,
  content: string,
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "users", uid, "essays", id), {
    content,
    lastSaved: now.slice(0, 10),
    updatedAt: now,
  });
}

/**
 * 수동 저장 — 현재 본문을 새 버전으로 push. version 번호는 직전 +1, 최대 MAX_VERSIONS개만
 * 유지(초과 시 오래된 것 제거). 갱신된 versions 배열을 반환해 호출자가 재조회 없이
 * 로컬 상태를 미러링할 수 있게 한다.
 */
export async function pushEssayVersion(
  uid: string,
  id: string,
  content: string,
  existingVersions: EssayVersion[],
): Promise<EssayVersion[]> {
  const now = new Date().toISOString();
  const nextVersion =
    (existingVersions[existingVersions.length - 1]?.version ?? 0) + 1;
  const newVersion: EssayVersion = {
    version: nextVersion,
    content,
    savedAt: now,
    wordCount: countWords(content),
  };
  const versions = [...existingVersions, newVersion].slice(-MAX_VERSIONS);
  await updateDoc(doc(db, "users", uid, "essays", id), {
    versions,
    content,
    lastSaved: now.slice(0, 10),
    updatedAt: now,
  });
  return versions;
}

/**
 * 첨삭 결과 저장 — reviews 맨 앞에 prepend(최신이 [0]; EssayCard가 reviews[0]을 최신으로
 * 사용). 최대 MAX_REVIEWS개 유지. 갱신된 reviews 배열을 반환.
 */
export async function appendReview(
  uid: string,
  id: string,
  review: EssayReview,
  existingReviews: EssayReview[],
): Promise<EssayReview[]> {
  const reviews = [review, ...existingReviews].slice(0, MAX_REVIEWS);
  await updateDoc(doc(db, "users", uid, "essays", id), {
    reviews,
    updatedAt: new Date().toISOString(),
  });
  return reviews;
}
