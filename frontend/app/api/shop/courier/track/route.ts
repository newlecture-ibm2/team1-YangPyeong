/* ════════════════════════════════════════════════════════
   BFF Route — 더미 택배 배송 조회 프록시
   GET /api/shop/courier/track?trackingNumber=xxx
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get('trackingNumber');

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, error: { message: '송장번호가 필요합니다.' } },
      { status: 400 }
    );
  }

  const result = await backendFetch(`/api/shop/courier/track?trackingNumber=${trackingNumber}`, {
    method: 'GET',
    withAuth: true,
  });

  return NextResponse.json(result);
}
