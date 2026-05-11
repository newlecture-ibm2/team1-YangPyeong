import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cropName: string }> }
) {
  const { cropName } = await params;
  
  const backendUrl = `/api/balance/${encodeURIComponent(cropName)}/trend`;

  return proxyToBackend(request, backendUrl);
}
