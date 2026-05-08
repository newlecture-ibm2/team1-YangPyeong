import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = await backendFetch(`/api/shop/seller/${id}/status`, {
    method: 'PATCH',
    body,
    withAuth: true,
  });

  return NextResponse.json(result);
}
