/**
 * BFF Route Handler: KAMIS 가격 단건 조회 (LLM 호출 없음)
 * GET /api/ai/product-assist/kamis-price?cropName=배추
 *
 * 상품 등록 페이지가 진입 시점에 호출하여 1kg 단가를 가져옵니다.
 */
import { NextRequest, NextResponse } from 'next/server';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

interface KamisPriceData {
  crop_name: string;
  price?: number;
  unit?: string;
  price_date?: string;
  category_name?: string | null;
}

interface KamisPriceApiResponse {
  status: string;
  data: KamisPriceData | null;
}

export async function GET(request: NextRequest) {
  const cropName = request.nextUrl.searchParams.get('cropName')?.trim();
  if (!cropName) {
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PRD-020', message: 'cropName은 필수입니다.' } },
      { status: 400 },
    );
  }

  try {
    const url = `${AI_SERVER_URL}/api/product-assist/kamis-price?cropName=${encodeURIComponent(cropName)}`;
    const aiRes = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!aiRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-021', message: 'AI 서버 요청 실패' } },
        { status: aiRes.status },
      );
    }

    const data: KamisPriceApiResponse = await aiRes.json();
    if (data.status !== 'ok' || !data.data) {
      // KAMIS 매칭 실패는 정상 응답 — data:null 로 반환
      return NextResponse.json({ success: true, data: null, error: null });
    }

    // snake_case → camelCase (price/unit/priceDate는 KAMIS 매칭 없을 때 null)
    return NextResponse.json({
      success: true,
      data: {
        cropName: data.data.crop_name,
        price: data.data.price ?? null,
        unit: data.data.unit ?? null,
        priceDate: data.data.price_date ?? null,
        categoryName: data.data.category_name ?? null,
      },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'KAMIS 가격 조회 실패';
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PRD-029', message: msg } },
      { status: 500 },
    );
  }
}
