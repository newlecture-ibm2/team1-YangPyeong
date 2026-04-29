/* ════════════════════════════════════════════════════════
   BFF API Route — 비밀번호 재설정: 보안질문 조회
   POST /api/auth/password-reset/question → Spring Boot /api/auth/password-reset/question
   ════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/auth/password-reset/question', { withAuth: false });
}
