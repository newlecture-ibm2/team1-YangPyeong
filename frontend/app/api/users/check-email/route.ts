import { proxyToBackend } from '@/lib/proxy';
import { NextRequest } from 'next/server';

/**
 * GET /api/users/check-email?email=xxx → Spring Boot /api/users/check-email?email=xxx
 * 이메일 상태 확인 (available / exists / withdrawn)
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return Response.json(
      { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: '이메일을 입력해주세요.' } },
      { status: 400 }
    );
  }

  return proxyToBackend(request, '/api/users/check-email', { withAuth: false });
}
