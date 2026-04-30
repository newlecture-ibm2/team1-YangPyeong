/* ════════════════════════════════════════════════════════
   BFF Route — 판매자 주문 관리 프록시
   GET   /api/shop/seller/order     → 판매자 주문 목록
   ════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET() {
  const result = await backendFetch('/api/shop/seller/order', { withAuth: true });
  return NextResponse.json(result);
}
