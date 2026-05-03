import { proxyToBackend } from '@/lib/proxy';
import { NextRequest } from 'next/server';

/**
 * GET /api/users/check-nickname?name=xxx → Spring Boot /api/users/check-nickname?name=xxx
 * 닉네임 중복 확인
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return Response.json(
      { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: '이름을 입력해주세요.' } },
      { status: 400 }
    );
  }

  return proxyToBackend(request, '/api/users/check-nickname', { withAuth: false });
}
