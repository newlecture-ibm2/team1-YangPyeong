/**
 * 재배 관리 API 연동 라이브러리
 */

export interface CultivationRegisterRequest {
  cropId: number;
  cultivationArea: number;   // 재배 면적 (㎡)
  expectedYield: number;     // 예상 수확량
  yieldUnit: string;         // g | kg | ton
  alreadyPlanted?: boolean;
  sowingDate?: string;       // YYYY-MM-DD
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
  sowingDate?: string;
}

/**
 * 농장별 재배 목록 조회
 */
export async function getCultivations(farmId: number): Promise<CultivationRegistration[]> {
  if (farmId === 0) return []; // 더미 농장(미리보기) 조회 스킵
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
 * 재배 등록 수정 (FRM-011)
 */
export async function updateCultivation(
  farmId: number,
  cultivationId: number,
  data: { area?: number; yield?: number; unit?: string }
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
