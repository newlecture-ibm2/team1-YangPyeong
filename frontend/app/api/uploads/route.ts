/* ════════════════════════════════════════════════════════
   BFF Route — 파일 업로드 프록시
   
   프론트에서 FormData로 전송한 파일을 백엔드로 전달합니다.
   파일 업로드는 JSON이 아닌 multipart/form-data이므로
   범용 프록시(proxy.ts)를 사용하지 않고 별도 처리합니다.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function POST(request: NextRequest) {
  try {
    // ── 인증 토큰 추출 ──
    const session = await getSessionFromCookie();
    const headers = new Headers();
    
    if (session?.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }

    // ── 원본 Content-Type 유지 (multipart boundary 포함) ──
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // ── 스트림을 그대로 백엔드에 전달 (메모리 부족 방지 및 인코딩 보존) ──
    const backendResponse = await fetch(`${BACKEND_URL}/api/uploads`, {
      method: 'POST',
      headers,
      body: request.body,
      // @ts-ignore: Next.js/Node fetch requires duplex for streams
      duplex: 'half',
    });

    // ── 백엔드 응답 반환 ──
    if (!backendResponse.ok) {
      console.error(`[BFF] 백엔드 파일 업로드 에러 (${backendResponse.status}):`, await backendResponse.text());
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'UPLOAD_PROXY_ERROR', message: '백엔드 파일 업로드 실패' },
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 파일 업로드 프록시 실패:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'UPLOAD_PROXY_ERROR',
          message: '파일 업로드 프록시 중 서버 오류가 발생했습니다.',
        },
      },
      { status: 502 },
    );
  }
}
