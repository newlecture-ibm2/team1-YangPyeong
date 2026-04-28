import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

/**
 * 지자체 데이터 내보내기 BFF Proxy
 * 프론트 → Next.js API Route → Spring Boot 백엔드
 * 파일(blob) 응답을 그대로 클라이언트에 전달합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();

    const requestHeaders = new Headers(request.headers);
    const userId = requestHeaders.get('X-USER-ID') || '1'; // 임시 처리, 추후 JWT 연동 시 세션/쿠키에서 추출 가능

    const backendRes = await fetch(
      `${BACKEND_URL}/api/gov/download?${queryString}`,
      {
        cache: 'no-store',
        headers: {
          'X-USER-ID': userId
        }
      }
    );

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'E-GOV-DL-001', message: '데이터 내보내기 실패' } },
        { status: backendRes.status }
      );
    }

    // 백엔드 응답 헤더를 그대로 전달
    const headers = new Headers();
    const contentType = backendRes.headers.get('Content-Type');
    const contentDisposition = backendRes.headers.get('Content-Disposition');

    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

    const blob = await backendRes.arrayBuffer();

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[BFF] Gov download proxy error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'E-GOV-DL-002', message: '서버 연결 실패' } },
      { status: 500 }
    );
  }
}
