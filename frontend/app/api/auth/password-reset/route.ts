/* ════════════════════════════════════════════════════════
   BFF API Route — 비밀번호 재설정 (임시 비밀번호 이메일 발송)
   POST /api/auth/password-reset → Spring Boot /api/auth/password-reset
   ════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/auth/password-reset', { withAuth: false });
}
