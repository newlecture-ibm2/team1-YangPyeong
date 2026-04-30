import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

/**
 * 농장 히스토리 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/farms/${id}/histories`);
}

/**
 * 농장 히스토리 직접 기록
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/farms/${id}/histories`);
}
