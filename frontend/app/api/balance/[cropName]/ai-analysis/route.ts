import { NextRequest, NextResponse } from 'next/server';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cropName: string }> }
) {
  try {
    const { cropName } = await params;
    const decodedCropName = decodeURIComponent(cropName);
    const body = await request.json().catch(() => ({}));

    const aiResponse = await fetch(`${AI_SERVER_URL}/api/balance-agent/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cropName: decodedCropName,
        townName: body.townName,
        townRatio: body.townRatio,
        townStatus: body.townStatus,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[BFF] AI Balance Agent API call failed:', aiResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: { code: 'AI_SERVER_ERROR', message: 'AI 서버에서 분석을 처리하지 못했습니다.' } },
        { status: aiResponse.status }
      );
    }

    const data = await aiResponse.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[BFF] AI Balance Agent proxy failure:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '서버 통신 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
