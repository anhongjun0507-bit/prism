import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

function getAdmin() {
  return { auth: getAdminAuth(), db: getAdminDb() };
}

export async function GET(req: NextRequest) {
  // 콜백을 호스팅하는 원본 (= opener 윈도우의 origin과 동일해야 정상)
  // postMessage 시 이 origin으로만 전달 — 다른 origin의 악성 페이지가 opener를 가장한 경우 토큰 유출 차단
  const targetOrigin = req.nextUrl.origin;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return errorResponse(error || "코드 없음", targetOrigin);
  }

  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // optional
  const REDIRECT_URI = `${req.nextUrl.origin}/api/auth/kakao/callback`;

  if (!KAKAO_CLIENT_ID) {
    return errorResponse("카카오 API 키가 설정되지 않았습니다", targetOrigin);
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
      return errorResponse("카카오 토큰 발급 실패", targetOrigin);
    }

    // Step 2: Get Kakao user profile
    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await profileRes.json();

    if (!kakaoUser.id) {
      return errorResponse("카카오 사용자 정보 조회 실패", targetOrigin);
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

    // Step 5: Return HTML that signs in via popup messaging.
    // postMessage 두 번째 인자에 명시적 origin 전달 → 다른 origin의 페이지가 opener를 가장해도 토큰 못 받음
    return new NextResponse(
      `<!DOCTYPE html><html><body>
        <script>
          (function() {
            var TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
            try {
              window.opener && window.opener.postMessage({
                type: "kakao-login-success",
                customToken: ${JSON.stringify(customToken)}
              }, TARGET_ORIGIN);
            } catch (e) {
              window.opener && window.opener.postMessage({
                type: "kakao-login-error",
                error: String(e && e.message || e)
              }, TARGET_ORIGIN);
            }
            window.close();
          })();
        </script>
        <p>로그인 처리 중...</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e: any) {
    console.error("Kakao auth error:", e);
    return errorResponse(e.message || "카카오 로그인 실패", targetOrigin);
  }
}

function errorResponse(msg: string, targetOrigin: string) {
  // 모든 동적 값(msg, targetOrigin)은 JSON.stringify로 escape → XSS 방어.
  // 화면 표시용 <p>는 dangerouslySet이 아닌 textContent로 setText 처리.
  return new NextResponse(
    `<!DOCTYPE html><html><body><p id="msg"></p><script>
      (function() {
        var msg = ${JSON.stringify(msg)};
        var targetOrigin = ${JSON.stringify(targetOrigin)};
        document.getElementById("msg").textContent = msg;
        try {
          window.opener && window.opener.postMessage({ type: "kakao-login-error", error: msg }, targetOrigin);
        } catch (_) { /* ignore */ }
        window.close();
      })();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
