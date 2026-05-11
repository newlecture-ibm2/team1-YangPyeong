import { ApiResponse } from '@/lib/constants';
import { CropRecommendResponse } from './recommend.types';

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
  return response.data;
}
