/**
 * BFF Route Handler: 농장 활동 이력 음성/텍스트 파싱
 * POST /api/farm/history/parse-voice
 *
 * FormData:
 *   audio (File)    — MediaRecorder 녹음 파일 (Safari/Firefox fallback)
 *   text  (string)  — Web Speech API 결과 텍스트 (Chrome/Edge)
 *   record_date (string, optional) — 기록 날짜
 *
 * 응답:
 *   { success: true, data: { activities: string[], content: string }, error: null }
 */
import { createVoiceRoute } from '@/lib/voice/createVoiceRoute';

export const maxDuration = 30;

export const POST = createVoiceRoute({ domain: 'farm_history' });
