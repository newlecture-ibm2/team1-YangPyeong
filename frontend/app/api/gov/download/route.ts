import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || '9040';
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/download?${searchParams.toString()}`, { 
      headers: { 'X-USER-ID': userId }
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
