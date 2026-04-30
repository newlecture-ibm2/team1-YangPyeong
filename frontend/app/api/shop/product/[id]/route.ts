/* ════════════════════════════════════════════════════════
   BFF Route — 상품 상세 프록시
   GET /api/shop/product/[id] → Spring Boot GET /api/shop/product/{id}
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await backendFetch(`/api/shop/product/${id}`, { withAuth: true });
  return NextResponse.json(result);
}
