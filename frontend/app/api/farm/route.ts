/* ════════════════════════════════════════════════════════
   BFF API Route — 농장(Farm) 컬렉션
   GET /api/farm → GET {BACKEND_URL}/api/farms
   POST /api/farm → POST {BACKEND_URL}/api/farms
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/**
 * 내 농장 목록 조회
 */
export async function GET() {
  try {
    const session = await getSessionFromCookie();
    
    // SKIP_AUTH가 true인 경우 개발용으로 세션 없이도 진행 가능하게 처리 (선택사항)
    // 여기서는 정석대로 세션 체크
    if (!session?.token && process.env.SKIP_AUTH !== 'true') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms`, {
      method: 'GET',
      headers: {
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    } else {
      const text = await backendResponse.text();
      console.error('[BFF] 백엔드에서 JSON이 아닌 응답을 반환함:', text);
      return NextResponse.json(
        { success: false, error: { code: 'BACKEND_ERROR', message: '백엔드 서버 응답 오류가 발생했습니다.' } },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('[BFF] 농장 목록 조회 중 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: `서버 통신 오류: ${error.message}` } },
      { status: 500 }
    );
  }
}

/**
 * 농장 등록 신청
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    
    // FormData로 수신
    const formData = await request.formData();

    if (!session?.token && process.env.SKIP_AUTH !== 'true') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms`, {
      method: 'POST',
      headers: {
        // multipart/form-data의 boundary를 fetch가 자동 생성하도록 Content-Type을 지정하지 않습니다.
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      body: formData,
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 농장 등록 실패:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
