/**
 * 재배 등록 API
 */

export interface CultivationRegisterRequest {
  cropId: number;
  cultivationArea: number;   // 재배 면적 (㎡)
  expectedYield: number;     // 예상 수확량
  yieldUnit: string;         // g | kg | ton
}

export interface CultivationRegisterResponse {
  id: number;
  farmId: number;
  cropId: number;
  cultivationArea: number;
  farmerEstimatedYield: number;
  yieldUnit: string;
}

export interface CultivationRegistration {
  id: number;
  farmId: number;
  cropId: number;
  cropName: string;
  cultivationArea: number;
  farmerEstimatedYield: number;
  yieldUnit: string;
}

/**
 * 농장별 재배 목록 조회
 */
export async function getCultivations(farmId: number): Promise<CultivationRegistration[]> {
  const response = await fetch(`/api/farm/${farmId}/cultivations`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || '재배 목록을 불러오는데 실패했습니다.');
  }

  return result.data;
}

/**
 * 기존 농장에 재배 등록
 */
export async function registerCultivation(
  farmId: number,
  data: CultivationRegisterRequest
): Promise<CultivationRegisterResponse> {
  const response = await fetch(`/api/farm/${farmId}/cultivations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || '재배 등록에 실패했습니다.');
  }

  return result.data;
}
