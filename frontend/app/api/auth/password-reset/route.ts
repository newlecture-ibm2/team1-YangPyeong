/* ════════════════════════════════════════════════════════
   BFF API Route — 비밀번호 재설정
   PUT /api/auth/password-reset → Spring Boot /api/auth/password-reset
   ════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/api/auth/password-reset', { withAuth: false });
}
