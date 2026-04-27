/* ════════════════════════════════════════════════════════
   FarmBalance — 쿠키 암호화/복호화 유틸리티
   httpOnly 쿠키에 JWT를 암호화하여 저장하고 복호화하여 추출
   ════════════════════════════════════════════════════════ */

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';

// ─── 간단한 Base64 인코딩/디코딩 (프로덕션에서는 iron-session 또는 jose 사용 권장) ───
// TODO: iron-session 또는 jose 라이브러리로 교체하여 AES-256 암호화 적용

const COOKIE_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

/**
 * JWT를 암호화하여 httpOnly 쿠키에 저장
 */
export async function setSessionCookie(token: string, refreshToken?: string) {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ token, refreshToken });
  const encoded = Buffer.from(payload).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7일
  });
}

/**
 * 쿠키에서 JWT를 복호화하여 추출
 */
export async function getSessionFromCookie(): Promise<{
  token: string;
  refreshToken?: string;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return null;

  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * 세션 쿠키 삭제 (로그아웃)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
