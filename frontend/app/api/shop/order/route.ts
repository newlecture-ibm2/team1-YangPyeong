/* ════════════════════════════════════════════════════════
   BFF Route — 주문 프록시
   GET    /api/shop/order → 내 주문 내역
   POST   /api/shop/order → 주문 생성
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET() {
  const result = await backendFetch('/api/shop/order', { withAuth: true });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await backendFetch('/api/shop/order', {
    method: 'POST',
    withAuth: true,
    body,
  });
  return NextResponse.json(result);
}
