/* ════════════════════════════════════════════════════════
   BFF Route — 상품 카테고리 목록 프록시
   GET /api/shop/category → Spring Boot GET /api/shop/category
   ════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET() {
  const result = await backendFetch('/api/shop/category');
  return NextResponse.json(result);
}
