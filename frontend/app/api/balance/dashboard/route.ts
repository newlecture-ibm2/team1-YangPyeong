import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const townCode = searchParams.get('townCode');
  
  let backendUrl = `/api/balance/dashboard`;
  if (townCode) {
    backendUrl += `?townCode=${townCode}`;
  }

  return proxyToBackend(request, backendUrl);
}
