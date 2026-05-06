import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

/**
 * 재배 등록 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cultivationId: string }> }
) {
  const { id, cultivationId } = await params;
  return proxyToBackend(request, `/api/farms/${id}/cultivations/${cultivationId}`);
}

/**
 * 재배 등록 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cultivationId: string }> }
) {
  const { id, cultivationId } = await params;
  return proxyToBackend(request, `/api/farms/${id}/cultivations/${cultivationId}`);
}
