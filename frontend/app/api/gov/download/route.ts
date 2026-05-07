import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getGovAuth } from '../_lib/govAuth';

export async function GET(request: Request) {
  
  const { skip, token } = await getGovAuth();
  if (!token && !skip) return NextResponse.json({ success: false, error: { message: '인증이 필요합니다.' } }, { status: 401 });
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/download?${searchParams.toString()}`, { 
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const blob = await res.blob();
    return new NextResponse(blob, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment'
      }
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
