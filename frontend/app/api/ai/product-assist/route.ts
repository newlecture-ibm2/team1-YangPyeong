/**
 * BFF Route Handler: AI 상품 설명 자동 생성
 * POST /api/ai/product-assist
 *
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000)
 */
import { NextRequest, NextResponse } from 'next/server';

/** AI 서버 URL (Docker 내부 통신 또는 로컬 개발) */
const AI_SERVER_URL =
  process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

interface AiDescriptionRequest {
  productName: string;
  categoryName: string;
}

interface AiDescriptionResponse {
  status: string;
  description: string | null;
  error: string | null;
}

export const maxDuration = 60; // 최대 60초 허용 (Vercel 배포 시 필요)

export async function POST(request: NextRequest) {
  try {
    const body: AiDescriptionRequest = await request.json();

    if (!body.productName?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-001', message: '상품명은 필수입니다.' } },
        { status: 400 },
      );
    }

    // AI 서버에 요청
    const aiResponse = await fetch(`${AI_SERVER_URL}/api/product-assist/description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_name: body.productName.trim(),
        category_name: body.categoryName?.trim() || '기타',
      }),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃 (생성 분량 증가로 연장)
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => null);
      const message = errorData?.detail?.message || 'AI 서버 요청에 실패했습니다.';
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-002', message } },
        { status: aiResponse.status },
      );
    }

    const data: AiDescriptionResponse = await aiResponse.json();

    if (data.status !== 'ok' || !data.description) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-003', message: data.error || 'AI 설명 생성에 실패했습니다.' } },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { description: data.description },
      error: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 설명 생성 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PRD-999', message } },
      { status: 500 },
    );
  }
}
