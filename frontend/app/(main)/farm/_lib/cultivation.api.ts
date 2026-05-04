import { HistoryType } from '../_components/Timeline/Timeline';

export interface RegisterCultivationRequest {
  cropId: number;
  cultivationType: HistoryType;
  cultivationArea: number;
  farmerEstimatedYield?: number;
  yieldUnit?: string;
}

export interface CultivationResponse {
  id: number;
  farmId: number;
  cropId: number;
  cultivationType: HistoryType;
  cultivationArea: number;
  farmerEstimatedYield?: number;
  aiPredictedYield?: number;
  yieldUnit?: string;
  verified: boolean;
}

/**
 * 재배 계획 등록 (Seed/Plan 공용)
 */
export async function registerCultivation(farmId: number, data: RegisterCultivationRequest): Promise<CultivationResponse> {
  const res = await fetch(`/api/farm/${farmId}/cultivations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '재배 등록에 실패했습니다.');
  }

  const response = await res.json();
  return response.data;
}

/**
 * 특정 농장의 재배 목록 조회
 */
export async function getCultivations(farmId: number): Promise<CultivationResponse[]> {
  const res = await fetch(`/api/farm/${farmId}/cultivations`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('재배 목록 조회에 실패했습니다.');
  }

  const response = await res.json();
  return response.data || [];
}
