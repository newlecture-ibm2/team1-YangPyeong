import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getGovAuth, SKIP_AUTH_GOV_USER_ID } from '../_lib/govAuth';

export async function GET(request: Request) {
  const { skip, token } = await getGovAuth();

  // 인증 필수 (SKIP_AUTH 아닐 때)
  if (!token && !skip) {
    return NextResponse.json({ success: false, error: { message: '인증이 필요합니다.' } }, { status: 401 });
  }

  // SKIP_AUTH 모드 + 세션 없음 → 백엔드 호출 불가(JWT 필요), 목 유저 반환
  // 실제 운영에서는 반드시 로그인 후 접근해야 합니다.
  if (!token && skip) {
    return NextResponse.json({
      success: true,
      data: {
        id: SKIP_AUTH_GOV_USER_ID,
        name: '양평군 담당자',
        role: 'GOV',
        regionCode: '4183',
        regionName: '양평군',
      },
    });
  }

  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/me?${searchParams.toString()}`, { 
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store' 
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
