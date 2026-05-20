import { ApiResponse } from '@/lib/constants';
import { CropRecommendResponse } from './recommend.types';
import { sanitizeRecommendResponse } from './recommend.utils';

const BASE_URL = '/api/recommend';

export async function requestCropRecommendation(farmId: number): Promise<CropRecommendResponse> {
  const res = await fetch(`${BASE_URL}/${farmId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'AI 작물 추천에 실패했습니다.');
  }
  
  const response: ApiResponse<CropRecommendResponse> = await res.json();
  if (!response.data) throw new Error('추천 결과 데이터가 없습니다.');
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
