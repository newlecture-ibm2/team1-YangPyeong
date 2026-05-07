import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080';

/**
 * POST /api/shop/payment/complete
 * 프론트에서 받은 결제 정보를 백엔드로 프록시하여 결제 검증을 수행합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 백엔드 결제 검증 API 호출
    const res = await fetch(`${BACKEND_URL}/api/shop/payment/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: 인증 토큰 전달 (쿠키에서 추출)
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ message: '서버 응답 파싱 실패' }));

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[payment/complete] 프록시 에러:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PAY-001', message: '결제 검증 요청 실패' } },
      { status: 500 }
    );
  }
}
