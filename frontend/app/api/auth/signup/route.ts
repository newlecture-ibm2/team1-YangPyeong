/* ════════════════════════════════════════════════════════
   BFF API Route — 회원가입
   POST /api/auth/signup → Spring Boot /api/auth/signup
   ════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/auth/signup', { withAuth: false });
}
