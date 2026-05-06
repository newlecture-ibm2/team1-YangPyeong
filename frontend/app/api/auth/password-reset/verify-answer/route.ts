import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

/**
 * BFF: 보안질문 답변 검증 (비밀번호 변경 없이 답변만 확인)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/verify-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[BFF] 보안질문 답변 검증 실패:', error);
    return NextResponse.json(
      { success: false, error: { message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
