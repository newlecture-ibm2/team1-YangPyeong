import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cropName: string }> }
) {
  const { cropName } = await params;
  
  // URL에서 year 쿼리 파라미터가 있는지 확인
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  
  let backendUrl = `/api/balance/${encodeURIComponent(cropName)}`;
  if (year) {
    backendUrl += `?year=${year}`;
  }

  return proxyToBackend(request, backendUrl);
}
