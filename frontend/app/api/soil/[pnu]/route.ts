import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { safeJsonParse } from '@/lib/safe-json';

/**
 * 토양 정보 통합 조회 핸들러 (지능형 Fallback 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pnu: string }> }
) {
  const { pnu } = await params;

  try {
    // 1. 물리성 및 화학성 데이터 동시 요청
    const [physRes, chemRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/soil/physical/${pnu}`),
      fetch(`${BACKEND_URL}/api/soil/chemical/${pnu}`)
    ]);

    const physData = (await safeJsonParse(physRes, `soil/physical/${pnu}`)) as Record<string, unknown> | null;
    const chemData = (await safeJsonParse(chemRes, `soil/chemical/${pnu}`)) as Record<string, unknown> | null;

    const physBody = (physData as Record<string, unknown> | null)?.body as Record<string, unknown> | undefined;
    const chemBody = (chemData as Record<string, unknown> | null)?.body as Record<string, unknown> | undefined;
    const chemHeader = (chemData as Record<string, unknown> | null)?.header as Record<string, unknown> | undefined;

    let chemical = (chemBody?.items as Array<Record<string, unknown>> | undefined)?.[0] || null;
    let isAverage = false;

    // 2. 만약 개별 필지 화학성 데이터가 없다면(301 등), 법정동 통계 조회
    if (!chemical || chemHeader?.resultCode === '301') {
      const bjdCode = pnu.substring(0, 10);
      console.log(`[Soil API Proxy] 개별 데이터 없음 -> 법정동 통계 조회 시작: ${bjdCode}`);
      
      const statRes = await fetch(`${BACKEND_URL}/api/soil/statistics/${bjdCode}`);
      const statData = (await safeJsonParse(statRes, `soil/statistics/${bjdCode}`)) as Record<string, unknown> | null;
      
      const statBody = (statData as Record<string, unknown> | null)?.body as Record<string, unknown> | undefined;
      const stats = (statBody?.items as Array<Record<string, unknown>> | undefined)?.[0];
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
      physical: (physBody?.items as Array<Record<string, unknown>> | undefined)?.[0] || null,
      chemical: chemical,
      isBjdAverage: isAverage,
      success: !!(physBody?.items || chemical)
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
