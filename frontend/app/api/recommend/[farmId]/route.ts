import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/recommend/${farmId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(180_000),
    });

    const contentType = backendResponse.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await backendResponse.text();
      console.error('[BFF] AI 추천 비-JSON 응답:', backendResponse.status, text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: backendResponse.status === 504 ? 'GATEWAY_TIMEOUT' : 'UPSTREAM_ERROR',
            message: backendResponse.status === 504
              ? '분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
              : '서버 응답 형식 오류가 발생했습니다.',
          },
        },
        { status: backendResponse.status >= 400 ? backendResponse.status : 502 },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] AI 작물 추천 요청 실패 (${error}):`);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
