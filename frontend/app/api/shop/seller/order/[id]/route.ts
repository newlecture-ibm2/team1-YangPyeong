/* ════════════════════════════════════════════════════════
   BFF Route — 판매자 주문 상태 변경 프록시
   PATCH /api/shop/seller/order/[id] → 주문 상태 변경
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = await backendFetch(`/api/shop/seller/order/${id}`, {
    method: 'PATCH',
    withAuth: true,
    body,
  });
  return NextResponse.json(result);
}
