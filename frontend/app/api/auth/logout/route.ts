/* ════════════════════════════════════════════════════════
   BFF API Route — 로그아웃
   POST /api/auth/logout
   
   세션 쿠키를 삭제하여 로그아웃 처리합니다.
   ════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/cookie';

export async function POST() {
  await clearSessionCookie();

  const response = NextResponse.json({
    success: true,
    data: { message: '로그아웃 성공' },
    error: null,
  });

  response.cookies.delete('fb-user');

  return response;
}
