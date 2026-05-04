/* ════════════════════════════════════════════════════════
   BFF API Route — 프로필 이미지 업로드
   POST /api/users/me/profile-image → Spring Boot /api/users/me/profile-image
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    if (!session?.token) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    // multipart/form-data 그대로 전달
    const formData = await request.formData();

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/me/profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        // Content-Type은 설정하지 않음 → fetch가 자동으로 multipart boundary 설정
      },
      body: formData,
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 프로필 이미지 업로드 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'IMAGE_UPLOAD_ERROR', message: '이미지 업로드 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
