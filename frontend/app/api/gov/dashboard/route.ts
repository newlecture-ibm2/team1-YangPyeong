import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/dashboard`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null, error: { code: 'E-GOV-DASH-001', message: '대시보드 조회 실패' } }, { status: 500 });
  }
}
