import { ApiResponse } from '@/lib/constants';
import { CropRecommendResponse } from './recommend.types';

const BASE_URL = '/api/recommend';

/** AI 작물 추천 실행 (분석하기 버튼 클릭 시) */
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

/** 가장 최근의 추천 이력 조회 (상세 페이지 등에서 사용) */
export async function requestLatestRecommendation(): Promise<CropRecommendResponse> {
  // 실제로는 URL 파라미터나 상태에서 farmId를 가져와야 하나, 
  // 백엔드의 /latest API가 유저의 가장 최근 분석 데이터를 돌려주도록 되어 있습니다.
  const res = await fetch(`${BASE_URL}/latest`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '최신 추천 정보를 가져오는데 실패했습니다.');
  }
  
  const response: ApiResponse<CropRecommendResponse> = await res.json();
  if (!response.data) throw new Error('추천 결과 데이터가 없습니다.');
  return response.data;
}
