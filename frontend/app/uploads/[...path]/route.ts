/* ════════════════════════════════════════════════════════
   BFF Route — 업로드 파일 프록시
   GET /uploads/** → Spring Boot GET /uploads/**
   이미지, 첨부파일 등 백엔드에 저장된 정적 파일을 프록시합니다.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');
  const backendUrl = `${BACKEND_URL}/uploads/${filePath}`;

  try {
    const response = await fetch(backendUrl);

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = response.body;

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24시간 캐시
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
