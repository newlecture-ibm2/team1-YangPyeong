/**
 * BFF Route Handler: AI 챗봇 SSE 스트리밍
 * POST /api/ai/chat/stream
 * Frontend → 이 Route Handler → AI 서버 (farm-ai:8000/api/chat/stream)
 *
 * 응답: Server-Sent Events (text/event-stream)
 *   - event: node_status → 에이전트 노드 진행 상황
 *   - event: result → 최종 응답 { reply, actions, pending_intent }
 *
 * 사용자 JWT는 httpOnly 쿠키에서 추출하여 AI 서버 metadata.jwt로 전달합니다.
 */
import { NextRequest } from 'next/server';

import { getSessionFromCookie } from '@/lib/cookie';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'E-CHAT-001', message: '메시지를 입력해주세요.' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 사용자 JWT 추출 (있으면 AI 서버에 전달)
    const session = await getSessionFromCookie();
    const metadata: Record<string, unknown> = {};
    if (session?.token) metadata.jwt = session.token;
    if (typeof body.currentPath === 'string') metadata.currentPath = body.currentPath;

    // AI 서버 SSE 스트리밍 호출
    const aiResponse = await fetch(`${AI_SERVER_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: body.userId || 0,
        roomId: body.roomId || 0,
        category: 'general',
        message,
        history: body.history || [],
        metadata,
        pending_intent: body.pending_intent ?? null,
      }),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'E-CHAT-002', message: 'AI 서버 스트리밍 요청 실패' } }),
        { status: aiResponse.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // AI 서버의 SSE 스트림을 그대로 클라이언트에 바이패스
    return new Response(aiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'AI 챗봇 스트리밍 오류';
    return new Response(
      JSON.stringify({ success: false, error: { code: 'E-CHAT-999', message: msg } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
