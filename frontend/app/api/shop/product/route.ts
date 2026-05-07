/* ════════════════════════════════════════════════════════
   BFF Route — 상품 목록 프록시
   GET /api/shop/product → Spring Boot GET /api/shop/product
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = `/api/shop/product${query ? `?${query}` : ''}`;

  const result = await backendFetch(path, { withAuth: true });
  return NextResponse.json(result);
}
