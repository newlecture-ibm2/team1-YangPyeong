/**
 * 수확 등록 API
 */

export interface HarvestRecordRequest {
  cultivationRegistrationId: number;
  harvestDate: string;
  yieldAmount: number;
  yieldUnit: string;
  grade?: string;
  toShop: boolean;
}

export interface HarvestRecordResponse {
  id: number;
  cultivationRegistrationId: number;
  harvestDate: string;
  yieldAmount: number;
  yieldUnit: string;
  grade?: string;
  toShop: boolean;
  createdAt: string;
}

/**
 * 수확 기록 등록
 */
export async function recordHarvest(
  data: HarvestRecordRequest
): Promise<HarvestRecordResponse> {
  const response = await fetch('/api/harvest-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || '수확 등록에 실패했습니다.');
  }

  return result.data;
}
