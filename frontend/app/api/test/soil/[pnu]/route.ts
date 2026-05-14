import { NextRequest, NextResponse } from 'next/server';

/**
 * 토양 분석 API를 백엔드(Spring Boot)로 프록시합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pnu: string } }
) {
  const { pnu } = await params;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const targetUrl = `${BACKEND_URL}/api/test/soil/${pnu}`;

  console.log(`[Soil Proxy] 요청 시작 - PNU: ${pnu}, Target: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: '토양 데이터를 가져오지 못했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Soil Proxy] Error:', error);
    return NextResponse.json(
      { message: '서버 통신 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
