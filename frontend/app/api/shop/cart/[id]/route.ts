/* ════════════════════════════════════════════════════════
   BFF Route — 장바구니 수정/삭제 프록시
   PATCH  /api/shop/cart/[id] → 수량 수정
   DELETE /api/shop/cart/[id] → 항목 삭제
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = await backendFetch(`/api/shop/cart/${id}`, {
    method: 'PATCH',
    withAuth: true,
    body,
  });
  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await backendFetch(`/api/shop/cart/${id}`, {
    method: 'DELETE',
    withAuth: true,
  });
  return NextResponse.json(result);
}
