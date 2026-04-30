import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/**
 * 농장 히스토리 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}/histories`, {
      method: 'GET',
      headers: {
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 히스토리 조회 실패:`, error);
    return NextResponse.json(
      { success: false, error: { message: '히스토리 정보를 가져오지 못했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * 농장 히스토리 직접 기록
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookie();
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}/histories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (backendResponse.status === 204 || backendResponse.status === 201 || backendResponse.ok) {
        // ApiResponse<Void> 는 보통 200 OK와 success: true를 반환함
        const data = await backendResponse.json().catch(() => ({ success: true }));
        return NextResponse.json(data, { status: 200 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 히스토리 기록 실패:`, error);
    return NextResponse.json(
      { success: false, error: { message: '히스토리를 기록하지 못했습니다.' } },
      { status: 500 }
    );
  }
}
