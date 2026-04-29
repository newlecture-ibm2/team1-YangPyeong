/* ════════════════════════════════════════════════════════
   BFF API Route — 농장(Farm) 단일 리소스
   GET /api/farm/[id] → GET {BACKEND_URL}/api/farms/{id}
   PATCH /api/farm/[id] → PATCH {BACKEND_URL}/api/farms/{id}
   DELETE /api/farm/[id] → DELETE {BACKEND_URL}/api/farms/{id}
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/**
 * 농장 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}`, {
      method: 'GET',
      headers: {
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 농장 상세 조회 실패 (${error}):`);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * 농장 정보 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookie();
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 농장 정보 수정 실패 (${error}):`);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * 농장 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookie();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farms/${id}`, {
      method: 'DELETE',
      headers: {
        ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[BFF] 농장 삭제 실패 (${error}):`);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
