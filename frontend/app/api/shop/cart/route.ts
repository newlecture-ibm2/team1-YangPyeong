/* ════════════════════════════════════════════════════════
   BFF Route — 장바구니 프록시
   GET    /api/shop/cart     → 장바구니 조회
   POST   /api/shop/cart     → 장바구니 담기
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await backendFetch('/api/shop/cart', { withAuth: true, revalidate: false });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await backendFetch('/api/shop/cart', {
    method: 'POST',
    withAuth: true,
    body,
  });
  return NextResponse.json(result);
}
