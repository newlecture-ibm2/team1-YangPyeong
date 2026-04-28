import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    if (sp.get('baseYear')) params.set('baseYear', sp.get('baseYear')!);
    if (sp.get('compareYear')) params.set('compareYear', sp.get('compareYear')!);
    if (sp.get('crop')) params.set('crop', sp.get('crop')!);
    const res = await fetch(`${BACKEND_URL}/api/gov/compare?${params}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null, error: { code: 'E-GOV-COMP-001', message: '연도비교 조회 실패' } }, { status: 500 });
  }
}
