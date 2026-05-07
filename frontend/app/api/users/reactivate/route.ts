/* ════════════════════════════════════════════════════════
   BFF API Route — 탈퇴 계정 재활성화
   POST /api/users/reactivate → Spring Boot /api/users/reactivate
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 계정 재활성화 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'REACTIVATE_ERROR', message: '계정 재활성화 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
