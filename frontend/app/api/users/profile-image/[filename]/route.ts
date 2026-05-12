/* ════════════════════════════════════════════════════════
   BFF API Route — 프로필 이미지 서빙
   GET /api/users/profile-image/[filename] → Spring Boot
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

const FALLBACK_PROFILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="default-profile"><rect width="128" height="128" rx="64" fill="#eef2f6"/><circle cx="64" cy="50" r="22" fill="#b8c2cc"/><path d="M26 106c7-20 24-30 38-30s31 10 38 30" fill="#b8c2cc"/></svg>`;

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
      // 이미지 파일이 실제로 없더라도 브라우저 콘솔 404를 만들지 않도록 기본 아바타를 반환한다.
      return new NextResponse(FALLBACK_PROFILE_SVG, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
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
    return new NextResponse(FALLBACK_PROFILE_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}
