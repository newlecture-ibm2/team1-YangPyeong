import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/sales`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null, error: { code: 'E-GOV-SALE-001', message: '판매현황 조회 실패' } }, { status: 500 });
  }
}
