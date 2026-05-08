/**
 * BFF Route Handler: 판매자 AI 인사이트
 * POST /api/ai/product-assist/insight
 *
 * Frontend → 이 Route Handler → AI 서버 (ai-server:8000)
 */
import { NextRequest, NextResponse } from 'next/server';

/** AI 서버 URL (Docker 내부 통신 또는 로컬 개발) */
const AI_SERVER_URL =
  process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

interface InsightApiResponse {
  status: string;
  insight: string | null;
  error: string | null;
}

export const maxDuration = 60; // 최대 60초 허용

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-020', message: '상품 목록은 필수입니다.' } },
        { status: 400 },
      );
    }

    const aiResponse = await fetch(`${AI_SERVER_URL}/api/product-assist/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: body.products,
      }),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => null);
      const message = errorData?.detail?.message || 'AI 서버 요청에 실패했습니다.';
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-021', message } },
        { status: aiResponse.status },
      );
    }

    const data: InsightApiResponse = await aiResponse.json();

    if (data.status !== 'ok' || !data.insight) {
      return NextResponse.json(
        { success: false, error: { code: 'E-BFF-PRD-022', message: data.error || 'AI 인사이트 생성에 실패했습니다.' } },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        insight: data.insight,
      },
      error: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 인사이트 생성 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: { code: 'E-BFF-PRD-029', message } },
      { status: 500 },
    );
  }
}
