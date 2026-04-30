import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/**
 * 농장 히스토리 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params;
    const session = await getSessionFromCookie();
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}/histories/${historyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (backendResponse.ok) {
        const data = await backendResponse.json().catch(() => ({ success: true }));
        return NextResponse.json(data, { status: 200 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 히스토리 수정 실패:`, error);
    return NextResponse.json(
      { success: false, error: { message: '히스토리를 수정하지 못했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * 농장 히스토리 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}/histories/${historyId}`, {
      method: 'DELETE',
      headers: {
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
    });

    if (backendResponse.ok) {
        const data = await backendResponse.json().catch(() => ({ success: true }));
        return NextResponse.json(data, { status: 200 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 히스토리 삭제 실패:`, error);
    return NextResponse.json(
      { success: false, error: { message: '히스토리를 삭제하지 못했습니다.' } },
      { status: 500 }
    );
  }
}
