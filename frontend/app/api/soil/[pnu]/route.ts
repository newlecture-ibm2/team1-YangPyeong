import { NextRequest, NextResponse } from 'next/server';

/**
 * 토양 정보 통합 조회 핸들러 (지능형 Fallback 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pnu: string } }
) {
  const { pnu } = await params;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    // 1. 물리성 및 화학성 데이터 동시 요청
    const [physRes, chemRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/soil/physical/${pnu}`),
      fetch(`${BACKEND_URL}/api/soil/chemical/${pnu}`)
    ]);

    let physData = await physRes.json();
    let chemData = await chemRes.json();

    let chemical = chemData.body?.items?.[0] || null;
    let isAverage = false;

    // 2. 만약 개별 필지 화학성 데이터가 없다면(301 등), 법정동 통계 조회
    if (!chemical || chemData.header?.resultCode === '301') {
      const bjdCode = pnu.substring(0, 10);
      console.log(`[Soil API Proxy] 개별 데이터 없음 -> 법정동 통계 조회 시작: ${bjdCode}`);
      
      const statRes = await fetch(`${BACKEND_URL}/api/soil/statistics/${bjdCode}`);
      const statData = await statRes.json();
      
      const stats = statData.body?.items?.[0];
      if (stats) {
        chemical = {
          acid: stats.acidAvg,
          om: stats.omAvg,
          vldpha: stats.vldphaAvg,
          addrNm: `${stats.bjdNm} (지역 평균)`,
          isBjdAverage: true
        };
        isAverage = true;
      }
    }

    // 3. 최종 데이터 통합
    const result = {
      pnu,
      physical: physData.body?.items?.[0] || null,
      chemical: chemical,
      isBjdAverage: isAverage,
      success: !!(physData.body?.items || chemical)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Soil API Proxy] 통합 호출 실패:', error);
    return NextResponse.json(
      { message: '토양 정보 통합 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
