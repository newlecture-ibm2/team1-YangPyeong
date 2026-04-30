/* ════════════════════════════════════════════════════════
   BFF Route — 판매자 상품 관리 프록시
   GET    /api/shop/seller     → 내 상품 목록
   POST   /api/shop/seller     → 상품 등록
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET() {
  const result = await backendFetch('/api/shop/seller', { withAuth: true });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await backendFetch('/api/shop/seller', {
    method: 'POST',
    withAuth: true,
    body,
  });
  return NextResponse.json(result);
}
