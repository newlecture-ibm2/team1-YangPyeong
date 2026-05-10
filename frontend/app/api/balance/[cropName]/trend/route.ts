import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cropName: string }> }
) {
  const { cropName } = await params;
  
  const backendUrl = `/api/v1/balance/${encodeURIComponent(cropName)}/trend`;

  return proxyToBackend(request, backendUrl);
}
