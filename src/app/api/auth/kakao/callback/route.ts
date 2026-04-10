import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return { auth: admin.auth(), db: admin.firestore() };
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return new NextResponse(
      `<!DOCTYPE html><html><body><script>
        window.opener?.postMessage({ type: "kakao-login-error", error: "${error || "코드 없음"}" }, "*");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // optional
  const REDIRECT_URI = `${req.nextUrl.origin}/api/auth/kakao/callback`;

  if (!KAKAO_CLIENT_ID) {
    return errorResponse("카카오 API 키가 설정되지 않았습니다");
  }

  try {
    // Step 1: Exchange code for Kakao access token
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        ...(KAKAO_CLIENT_SECRET && { client_secret: KAKAO_CLIENT_SECRET }),
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return errorResponse("카카오 토큰 발급 실패");
    }

    // Step 2: Get Kakao user profile
    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await profileRes.json();

    if (!kakaoUser.id) {
      return errorResponse("카카오 사용자 정보 조회 실패");
    }

    const kakaoId = `kakao:${kakaoUser.id}`;
    const email = kakaoUser.kakao_account?.email || `${kakaoUser.id}@kakao.local`;
    const name = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url;

    // Step 3: Create or get Firebase user
    const { auth, db } = getAdmin();
    let firebaseUid: string;

    try {
      const existing = await auth.getUser(kakaoId);
      firebaseUid = existing.uid;
    } catch {
      // User doesn't exist - create
      const newUser = await auth.createUser({
        uid: kakaoId,
        email,
        displayName: name,
        photoURL,
      });
      firebaseUid = newUser.uid;

      // Initialize profile in Firestore
      await db.collection("users").doc(firebaseUid).set({
        name,
        grade: "",
        dreamSchool: "",
        major: "",
        photoURL: photoURL || null,
        onboarded: false,
        plan: "free",
        provider: "kakao",
      }, { merge: true });
    }

    // Step 4: Create Firebase custom token
    const customToken = await auth.createCustomToken(firebaseUid);

    // Step 5: Return HTML that signs in via popup messaging
    return new NextResponse(
      `<!DOCTYPE html><html><body>
        <script>
          (async function() {
            try {
              // Send custom token to opener window
              window.opener?.postMessage({
                type: "kakao-login-success",
                customToken: ${JSON.stringify(customToken)}
              }, "*");
              window.close();
            } catch (e) {
              window.opener?.postMessage({ type: "kakao-login-error", error: e.message }, "*");
              window.close();
            }
          })();
        </script>
        <p>로그인 처리 중...</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e: any) {
    console.error("Kakao auth error:", e);
    return errorResponse(e.message || "카카오 로그인 실패");
  }
}

function errorResponse(msg: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({ type: "kakao-login-error", error: ${JSON.stringify(msg)} }, "*");
      window.close();
    </script><p>${msg}</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
