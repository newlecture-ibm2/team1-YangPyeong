/**
 * BFF Route Handler: AI 상품 자동 채우기
 * POST /api/ai/product-assist/autofill
 *
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000)
 */
import { NextRequest, NextResponse } from 'next/server';

/** AI 서버 URL (Docker 내부 통신 또는 로컬 개발) */
const AI_SERVER_URL =
  process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

interface AutofillApiResponse {
  status: string;
  data: {
    category_name: string;
    price: number;
    stock: number;
    description: string;
    is_kamis_applied?: boolean;
  } | null;
  error: string | null;
}

export const maxDuration = 60; // 최대 60초 허용 (Vercel 배포 시 필요)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.productName?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-010', message: '상품명은 필수입니다.' } },
        { status: 400 },
      );
    }

    // camelCase → snake_case 변환하여 AI 서버에 전달
    // farmContext가 없으면(null) AI 서버는 기존 추론 모드로 동작
    const aiPayload: Record<string, unknown> = {
      product_name: body.productName.trim(),
    };

    if (body.farmContext) {
      aiPayload.farm_context = {
        farm_name: body.farmContext.farmName,
        address: body.farmContext.address || '',
        soil_type: body.farmContext.soilType || null,
        organic_matter: body.farmContext.organicMatter || null,
        crop_name: body.farmContext.cropName,
        cultivation_area: body.farmContext.cultivationArea || null,
        harvest_records: (body.farmContext.harvestRecords || []).map(
          (h: { harvestDate: string; yieldAmount: number; yieldUnit: string; grade?: string }) => ({
            harvest_date: h.harvestDate,
            yield_amount: h.yieldAmount,
            yield_unit: h.yieldUnit,
            grade: h.grade || null,
          }),
        ),
      };
    }

    const aiResponse = await fetch(`${AI_SERVER_URL}/api/product-assist/autofill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiPayload),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃 (전체 필드 생성은 시간 더 필요)
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => null);
      const message = errorData?.detail?.message || 'AI 서버 요청에 실패했습니다.';
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-011', message } },
        { status: aiResponse.status },
      );
    }

    const data: AutofillApiResponse = await aiResponse.json();

    if (data.status !== 'ok' || !data.data) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-012', message: data.error || 'AI 자동 채우기에 실패했습니다.' } },
        { status: 500 },
      );
    }

    // snake_case → camelCase 변환
    return NextResponse.json({
      success: true,
      data: {
        categoryName: data.data.category_name,
        price: data.data.price,
        stock: data.data.stock,
        description: data.data.description,
        isKamisApplied: data.data.is_kamis_applied || false,
      },
      error: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 자동 채우기 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PRD-019', message } },
      { status: 500 },
    );
  }
}
