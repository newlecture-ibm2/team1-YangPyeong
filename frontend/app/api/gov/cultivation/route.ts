import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    if (sp.get('year')) params.set('year', sp.get('year')!);
    if (sp.get('region')) params.set('region', sp.get('region')!);
    if (sp.get('crop')) params.set('crop', sp.get('crop')!);
    const res = await fetch(`${BACKEND_URL}/api/gov/cultivation?${params}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null, error: { code: 'E-GOV-CULT-001', message: '재배현황 조회 실패' } }, { status: 500 });
  }
}
