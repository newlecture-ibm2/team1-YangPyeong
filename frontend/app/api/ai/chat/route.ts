/**
 * BFF Route Handler: AI 챗봇
 * POST /api/ai/chat
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000)
 */
import { NextRequest, NextResponse } from 'next/server';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: 'E-CHAT-001', message: '메시지를 입력해주세요.' } },
        { status: 400 },
      );
    }

    // AI 서버의 chat.py 엔드포인트 호출
    // chat.py가 기대하는 스키마: { userId, roomId, category, message, metadata? }
    const aiResponse = await fetch(`${AI_SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message: message,
        history: body.history || [],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'E-CHAT-002', message: 'AI 서버 요청 실패' } },
        { status: aiResponse.status },
      );
    }

    // chat.py 응답 스키마: { reply: string }
    const data = await aiResponse.json();

    return NextResponse.json({
      success: true,
      data: { reply: data.reply },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'AI 챗봇 오류';
    return NextResponse.json(
      { success: false, error: { code: 'E-CHAT-999', message: msg } },
      { status: 500 },
    );
  }
}
