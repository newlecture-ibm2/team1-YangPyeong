import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

type RouteParams = { params: Promise<{ farmId: string; cropId: string }> };

async function authHeaders() {
  const session = await getSessionFromCookie();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { farmId, cropId } = await params;
    const experienceLevel = request.nextUrl.searchParams.get('experienceLevel') ?? 'novice';
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/recommend/farms/${farmId}/crops/${cropId}/detailed-guide?experienceLevel=${encodeURIComponent(experienceLevel)}`,
      { method: 'GET', headers: await authHeaders(), cache: 'no-store' },
    );
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 재배 가이드 캐시 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: '재배 가이드 조회 중 서버 통신 오류가 발생했습니다.' },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { farmId, cropId } = await params;
    const body = await request.json();
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/recommend/farms/${farmId}/crops/${cropId}/detailed-guide`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(body),
      },
    );
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 재배 가이드 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: '재배 가이드 생성 중 서버 통신 오류가 발생했습니다.' },
      },
      { status: 500 },
    );
  }
}
