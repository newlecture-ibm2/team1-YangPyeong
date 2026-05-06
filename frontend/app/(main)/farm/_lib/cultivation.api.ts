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

/**
 * 재배 등록 수정
 */
export async function updateCultivation(
  farmId: number,
  cultivationId: number,
  data: Partial<CultivationRegisterRequest>
): Promise<void> {
  const response = await fetch(`/api/farm/${farmId}/cultivations/${cultivationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error?.message || '재배 정보 수정에 실패했습니다.');
  }
}

/**
 * 재배 등록 삭제
 */
export async function deleteCultivation(
  farmId: number,
  cultivationId: number
): Promise<void> {
  const response = await fetch(`/api/farm/${farmId}/cultivations/${cultivationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error?.message || '재배 정보 삭제에 실패했습니다.');
  }
}
