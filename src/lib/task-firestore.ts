"use client";

/**
 * Planner task CRUD 헬퍼 — 클라이언트 SDK 직접 호출 (essay-firestore와 동형).
 *
 * Firestore rules가 users/{uid}/tasks에 request.auth.uid == uid 권한을 처리하므로 API 경유 불필요.
 * client Firestore는 ignoreUndefinedProperties:true라 notes 미지정도 안전.
 */
import { collection, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { PlannerTask } from "@/types/planner";

export function newTaskId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** PlannerTask → Firestore 저장 payload (id 제외). */
function toPayload(t: PlannerTask): Record<string, unknown> {
  const p: Record<string, unknown> = {
    title: t.title,
    category: t.category,
    dueDate: t.dueDate,
    completed: t.completed,
  };
  if (t.notes) p.notes = t.notes;
  return p;
}

/** 신규 유저용 기본 마일스톤 6개 (cycleYear 기반). 빈 플래너에 1회 seed. */
export function getInitialTasks(): PlannerTask[] {
  const y = new Date().getFullYear();
  const next = y + 1;
  return [
    { id: newTaskId(), title: "SAT 시험 응시", category: "시험", dueDate: `${y}-08-24`, completed: false },
    { id: newTaskId(), title: "Common App 계정 생성", category: "행정", dueDate: `${y}-09-01`, completed: false },
    { id: newTaskId(), title: "Personal Statement 초안 완성", category: "에세이", dueDate: `${y}-09-15`, completed: false },
    { id: newTaskId(), title: "교사 추천서 요청", category: "추천서", dueDate: `${y}-10-01`, completed: false },
    { id: newTaskId(), title: "Early Decision 마감 (1차)", category: "지원", dueDate: `${y}-11-01`, completed: false },
    { id: newTaskId(), title: "Regular Decision 마감", category: "지원", dueDate: `${next}-01-01`, completed: false },
  ];
}

/** 미완료 우선(dueDate asc), 완료는 하단(dueDate asc). */
export function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export async function addTask(uid: string, task: PlannerTask): Promise<void> {
  await setDoc(doc(db, "users", uid, "tasks", task.id), toPayload(task));
}

/** 전체 upsert (toggle·수정 공용). */
export async function updateTask(uid: string, task: PlannerTask): Promise<void> {
  await setDoc(doc(db, "users", uid, "tasks", task.id), toPayload(task));
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "tasks", id));
}

/** 여러 task 일괄 저장 (seed·AI 생성 결과). */
export async function saveTasksBatch(uid: string, tasks: PlannerTask[]): Promise<void> {
  const batch = writeBatch(db);
  for (const t of tasks) batch.set(doc(db, "users", uid, "tasks", t.id), toPayload(t));
  await batch.commit();
}
