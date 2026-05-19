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
import type { Essay } from "@/types/essay";

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
