/* ════════════════════════════════════════════════════════
   BFF API Route — 프로필 이미지 서빙
   GET /api/users/profile-image/[filename] → Spring Boot
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/profile-image/${filename}`,
      { cache: 'force-cache' },
    );

    if (!backendResponse.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const contentType = backendResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await backendResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Image fetch failed' }, { status: 500 });
  }
}
