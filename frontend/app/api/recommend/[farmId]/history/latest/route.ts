import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/** 구버전 백엔드: 추천 이력 없음을 400 + IllegalArgument 메시지로 내려내던 경우 */
function isLegacyEmptyRecommendHistoryResponse(status: number, body: unknown): boolean {
  if (status !== 400 || body === null || typeof body !== 'object') return false;
  const msg = String((body as { error?: { message?: string } }).error?.message ?? '');
  return msg.includes('추천 이력이 없습니다');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/recommend/${farmId}/history/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();

    if (isLegacyEmptyRecommendHistoryResponse(backendResponse.status, data)) {
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] AI 최근 추천 이력 조회 실패 (${error}):`);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
