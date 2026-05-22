/* ════════════════════════════════════════════════════════
   BFF Voice Route Factory — 음성 파싱 Route Handler 생성기

   도메인별 Route Handler를 생성하는 팩토리 함수.
   인증, Rate Limit, AI 서버 프록시를 한 번에 처리합니다.

   사용법:
     export const POST = createVoiceRoute({ domain: 'farm_history' });
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

import { getSessionFromCookie } from '@/lib/cookie';
import { checkRateLimit } from '@/lib/rate-limit';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';
const AI_INTERNAL_KEY = process.env.AI_INTERNAL_SECRET_KEY || '';

// 대용량 오디오 업로드 허용 (기본 4MB Next.js 제한 우회)
export const maxDuration = 30;

interface VoiceRouteOptions {
  /** 도메인 식별자 (AI 서버 /api/parse/{domain}/voice|text 와 일치) */
  domain: string;
  /** 분당 요청 한도 (기본 10회) */
  rateLimitPerMin?: number;
  /** 최대 페이로드 바이트 (기본 6MB) */
  maxPayloadBytes?: number;
  /** AI 서버 타임아웃 (ms, 기본 15초) */
  timeoutMs?: number;
}

function _errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

function _hashKey(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

/**
 * 음성/텍스트 파싱 BFF Route Handler를 생성합니다.
 *
 * 요청 FormData:
 *   - audio (File)  → /api/parse/{domain}/voice (MediaRecorder fallback)
 *   - text  (string) → /api/parse/{domain}/text  (Web Speech API)
 *   - record_date (string, optional)
 */
export function createVoiceRoute({
  domain,
  rateLimitPerMin = 10,
  maxPayloadBytes = 6 * 1024 * 1024,
  timeoutMs = 15_000,
}: VoiceRouteOptions) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    // ── 1. 인증 ──
    const session = await getSessionFromCookie();
    if (!session?.token) {
      return _errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401);
    }

    // ── 2. Rate Limit ──
    const key = `voice:${domain}:${_hashKey(session.token)}`;
    if (!checkRateLimit(key, rateLimitPerMin, 60)) {
      return _errorResponse(
        'RATE_LIMIT_EXCEEDED',
        '잠시 후 다시 시도해주세요. (분당 요청 한도 초과)',
        429,
      );
    }

    // ── 3. FormData 파싱 ──
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return _errorResponse('INVALID_FORM', '요청 형식이 올바르지 않습니다.', 400);
    }

    const audioFile = form.get('audio') as File | null;
    const textInput = form.get('text') as string | null;
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayFallback = `${kst.getUTCFullYear()}/${String(kst.getUTCMonth() + 1).padStart(2, '0')}/${String(kst.getUTCDate()).padStart(2, '0')}`;
    const recordDate = (form.get('record_date') as string | null) || todayFallback;

    if (!audioFile && !textInput?.trim()) {
      return _errorResponse('MISSING_INPUT', '음성 또는 텍스트 입력이 필요합니다.', 400);
    }

    // ── 4. 페이로드 크기 검증 ──
    if (audioFile && audioFile.size > maxPayloadBytes) {
      return _errorResponse(
        'PAYLOAD_TOO_LARGE',
        `파일 크기가 너무 큽니다. 최대 ${Math.round(maxPayloadBytes / 1024 / 1024)}MB까지 허용됩니다.`,
        413,
      );
    }

    // ── 5. AI 서버로 전달할 FormData 구성 ──
    const aiForm = new FormData();
    aiForm.append('record_date', recordDate);

    let aiPath: string;
    if (audioFile) {
      aiForm.append('audio', audioFile, 'recording.webm');
      aiPath = `/api/parse/${domain}/voice`;
    } else {
      aiForm.append('text', textInput!.trim());
      aiPath = `/api/parse/${domain}/text`;
    }

    // ── 6. AI 서버 호출 ──
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const aiResponse = await fetch(`${AI_SERVER_URL}${aiPath}`, {
        method: 'POST',
        headers: { 'X-AI-Internal-Key': AI_INTERNAL_KEY },
        body: aiForm,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errBody = await aiResponse.json().catch(() => ({}));
        const detail = errBody?.detail || `AI 서버 오류 (${aiResponse.status})`;
        return _errorResponse('AI_SERVER_ERROR', detail, aiResponse.status >= 500 ? 502 : aiResponse.status);
      }

      const data = await aiResponse.json();
      return NextResponse.json({ success: true, data, error: null });
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        return _errorResponse('TIMEOUT', '요청 시간이 초과되었습니다. 다시 시도해주세요.', 504);
      }
      console.error(`[VoiceRoute:${domain}] AI 서버 연결 실패:`, e);
      return _errorResponse('AI_UNREACHABLE', 'AI 서버에 연결할 수 없습니다.', 502);
    }
  };
}
