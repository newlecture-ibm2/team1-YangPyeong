import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  try {
    const { farmId } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/revenue/farms/${farmId}/predictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 수익 예측 이력 조회 실패 (${error}):`);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: '수익 예측 이력 조회 중 서버 통신 오류가 발생했습니다.' },
      },
      { status: 500 },
    );
  }
}
