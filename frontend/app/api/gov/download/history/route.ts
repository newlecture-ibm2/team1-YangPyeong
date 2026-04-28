import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

/**
 * 다운로드 이력 조회 BFF Proxy
 */
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers);
    const userId = requestHeaders.get('X-USER-ID') || '1'; // 임시 처리 추후 JWT

    const res = await fetch(`${BACKEND_URL}/api/gov/download/history`, {
      cache: 'no-store',
      headers: {
        'X-USER-ID': userId
      }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-GOV-DLH-001', message: '이력 조회 실패' } },
      { status: 500 }
    );
  }
}
