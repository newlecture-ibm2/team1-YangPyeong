/**
 * BFF Route Handler: AI 챗봇
 * POST /api/ai/chat
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000)
 *
 * 응답 스키마:
 *   { success: true, data: { reply: string, actions: ChatAction[] }, error: null }
 *
 * 사용자 JWT는 httpOnly 쿠키에서 추출하여 AI 서버 metadata.jwt로 전달합니다.
 * Shop Agent 등 백엔드 호출이 필요한 도구가 ContextVar를 통해 인증을 자동 처리합니다.
 */
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromCookie } from '@/lib/cookie';
import type { ChatAction } from '@/lib/chat-types';

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

    // ── 사용자 JWT 추출 (있으면 AI 서버에 전달) ──
    const session = await getSessionFromCookie();
    const metadata: Record<string, unknown> = {};
    if (session?.token) metadata.jwt = session.token;
    if (typeof body.currentPath === 'string') metadata.currentPath = body.currentPath;

    // ── AI 서버 호출 ──
    const aiResponse = await fetch(`${AI_SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message,
        history: body.history || [],
        metadata,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'E-CHAT-002', message: 'AI 서버 요청 실패' } },
        { status: aiResponse.status },
      );
    }

    // AI 서버 응답: { reply: string, actions: ChatAction[] }
    const data: { reply?: string; actions?: ChatAction[] } = await aiResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        reply: data.reply ?? '',
        actions: data.actions ?? [],
      },
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
