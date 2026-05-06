import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants';

/** 캐시된 SKIP_AUTH 토큰 (서버 프로세스 수명 동안 유지) */
let cachedSkipAuthToken: string | null = null;

/**
 * Gov BFF 공통 인증 헬퍼
 * - 세션 있음 → 세션 토큰 사용
 * - SKIP_AUTH=true + 세션 없음 → GOV 계정 자동 로그인 후 토큰 사용
 * - 그 외 → token: null (401 처리)
 */
export async function getGovAuth(): Promise<{ skip: boolean; token: string | null }> {
  const session = await getSessionFromCookie();
  const skipAuth = process.env.SKIP_AUTH === 'true';

  if (session?.token) {
    return { skip: false, token: session.token };
  }

  if (skipAuth) {
    // 캐시된 토큰이 있으면 재사용
    if (cachedSkipAuthToken) {
      return { skip: true, token: cachedSkipAuthToken };
    }

    // GOV 테스트 계정으로 실제 로그인하여 토큰 발급
    try {
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'gov-yangpyeong@farmbalance.kr',
          password: 'test1234!',
        }),
      });
      const loginData = await loginRes.json();
      if (loginData.success && loginData.data?.accessToken) {
        cachedSkipAuthToken = loginData.data.accessToken;
        return { skip: true, token: cachedSkipAuthToken };
      }
    } catch (e) {
      console.error('[govAuth] SKIP_AUTH 로그인 실패:', e);
    }

    // 로그인 실패 시 에러
    return { skip: true, token: null };
  }

  return { skip: false, token: null };
}
