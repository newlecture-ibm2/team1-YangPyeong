/* ════════════════════════════════════════════════════════
   BFF Route — 판매자 상품 수정/삭제 프록시
   PATCH  /api/shop/seller/[id] → 상품 수정
   DELETE /api/shop/seller/[id] → 상품 삭제
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = await backendFetch(`/api/shop/seller/${id}`, {
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
  const result = await backendFetch(`/api/shop/seller/${id}`, {
    method: 'DELETE',
    withAuth: true,
  });
  return NextResponse.json(result);
}
