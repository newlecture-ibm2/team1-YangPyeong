/* ════════════════════════════════════════════════════════
   BFF Route — 구매자 주문 취소 프록시
   PATCH /api/shop/order/[id]/cancel → 주문 취소 (ORDERED 상태만)
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await backendFetch(`/api/shop/order/${id}/cancel`, {
    method: 'PATCH',
    withAuth: true,
  });
  return NextResponse.json(result);
}
