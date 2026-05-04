import { proxyToBackend } from '@/lib/proxy';
import { NextRequest } from 'next/server';

/**
 * GET /api/users/check-nickname?name=xxx&excludeEmail=yyy
 * → Spring Boot /api/users/check-nickname?name=xxx&excludeEmail=yyy
 * 닉네임 중복 확인 (프로필 수정 시 자기 자신은 제외)
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return Response.json(
      { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: '이름을 입력해주세요.' } },
      { status: 400 }
    );
  }

  // excludeEmail이 있으면 자기 자신 제외 (프로필 수정용)
  const excludeEmail = request.nextUrl.searchParams.get('excludeEmail');
  const backendPath = excludeEmail
    ? `/api/users/check-nickname?name=${encodeURIComponent(name)}&excludeEmail=${encodeURIComponent(excludeEmail)}`
    : `/api/users/check-nickname?name=${encodeURIComponent(name)}`;

  return proxyToBackend(request, backendPath, { withAuth: true });
}
