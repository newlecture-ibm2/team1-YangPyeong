import { ApiResponse } from '@/lib/constants';
import { CropRecommendResponse } from './recommend.types';
import { sanitizeRecommendResponse } from './recommend.utils';

const BASE_URL = '/api/recommend';

/** 빠른 분석(점수·순위) — LLM 없음 */
const QUICK_RECOMMEND_TIMEOUT_MS = 60_000;
/** AI 코칭 — 작물 수에 따라 길어질 수 있음 */
const COACHING_TIMEOUT_MS = 180_000;

async function parseErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await res.json()) as ApiResponse<unknown>;
      return body.error?.message || `요청 실패 (${res.status})`;
    } catch {
      return `요청 실패 (${res.status})`;
    }
  }
  if (res.status === 504) {
    return '분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
  }
  return `AI 작물 추천에 실패했습니다. (${res.status})`;
}

export async function requestCropRecommendation(farmId: number): Promise<CropRecommendResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${farmId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(QUICK_RECOMMEND_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(
        '분석 시간이 초과되었습니다. 등록된 작물이 많으면 더 오래 걸릴 수 있습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
    throw e;
  }

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  const response: ApiResponse<CropRecommendResponse> = await res.json();
  if (!response.data) throw new Error('추천 결과 데이터가 없습니다.');
  return sanitizeRecommendResponse(response.data);
}

export async function requestAiCoaching(
  farmId: number,
  cropIds: number[],
): Promise<CropRecommendResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${farmId}/coaching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cropIds }),
      signal: AbortSignal.timeout(COACHING_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(
        'AI 코칭 시간이 초과되었습니다. 선택한 작물이 많으면 더 오래 걸릴 수 있습니다. 작물 수를 줄여 다시 시도해 주세요.',
      );
    }
    throw e;
  }

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  const response: ApiResponse<CropRecommendResponse> = await res.json();
  if (!response.data) throw new Error('AI 코칭 결과 데이터가 없습니다.');
  return sanitizeRecommendResponse(response.data);
}

export async function getLatestRecommendHistory(farmId: number): Promise<CropRecommendResponse | null> {
  const res = await fetch(`${BASE_URL}/${farmId}/history/latest`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const response = (await res.json()) as ApiResponse<CropRecommendResponse>;

  if (!res.ok) {
    if (res.status === 404) return null;
    const msg = response.error?.message ?? '';
    // 구버전 백엔드: 이력 없음을 400으로 내려내던 경우
    if (res.status === 400 && msg.includes('추천 이력이 없습니다')) {
      return null;
    }
    throw new Error(msg || '최근 AI 추천 이력 조회에 실패했습니다.');
  }

  return response.data ? sanitizeRecommendResponse(response.data) : null;
}
