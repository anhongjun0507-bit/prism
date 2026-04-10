import * as admin from "firebase-admin";
import crypto from "crypto";

function getAdminDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.firestore();
}

/**
 * Generate a deterministic cache key from input object
 */
export function makeCacheKey(prefix: string, data: object): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  const hash = crypto.createHash("md5").update(json).digest("hex");
  return `${prefix}_${hash}`;
}

/**
 * Get cached AI response from Firestore (server-side).
 * Returns null on miss or error.
 */
export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection("ai_cache").doc(key).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    // Cache TTL: 30 days
    const ageDays = (Date.now() - (data.createdAt || 0)) / (1000 * 60 * 60 * 24);
    if (ageDays > 30) return null;

    return data.response;
  } catch {
    return null;
  }
}

/**
 * Store AI response in Firestore cache (server-side, fire-and-forget).
 */
export async function setCachedResponse(key: string, response: any): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection("ai_cache").doc(key).set({
      response,
      createdAt: Date.now(),
    });
  } catch {
    // Silent fail — cache is optional
  }
}
