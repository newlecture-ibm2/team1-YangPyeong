import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  
  let backendUrl = `/api/balance`;
  if (year) {
    backendUrl += `?year=${year}`;
  }

  return proxyToBackend(request, backendUrl);
}
