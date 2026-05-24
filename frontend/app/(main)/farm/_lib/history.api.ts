import { HistoryType } from '../_components/Timeline/Timeline';

export interface CultivationHistory {
  id: number;
  farmId: number;
  cultivationRegistrationId?: number;
  recordDate: string;
  activityType: 'USER' | 'WEATHER' | 'SYSTEM' | 'WATER' | 'FERTILIZER' | 'PESTICIDE' | 'ETC';
  activityContent: string;
  avgTemp?: number;
  totalRain?: number;
  createdAt: string;
}

/**
 * 특정 농장의 재배 이력 조회
 */
export async function getFarmHistories(farmId: number): Promise<CultivationHistory[]> {
  if (farmId === 0) return []; // 더미 농장(미리보기) 조회 스킵
  const res = await fetch(`/api/farm/${farmId}/histories`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('이력 조회에 실패했습니다.');
  }

  const response = await res.json();
  return response.data || [];
}

/**
 * 재배 이력 직접 기록
 */
export async function recordFarmHistory(farmId: number, content: string, recordDate?: string): Promise<void> {
  const res = await fetch(`/api/farm/${farmId}/histories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activityContent: content,
      activityType: 'USER',
      recordDate: recordDate || new Date().toISOString().split('T')[0],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '이력 기록에 실패했습니다.');
  }
}

/**
 * 재배 이력 수정
 */
export async function updateFarmHistory(farmId: number, historyId: number, content: string): Promise<void> {
  const res = await fetch(`/api/farm/${farmId}/histories/${historyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activityContent: content,
      activityType: 'USER',
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '이력 수정에 실패했습니다.');
  }
}

/**
 * 재배 이력 삭제
 */
export async function deleteFarmHistory(farmId: number, historyId: number): Promise<void> {
  const res = await fetch(`/api/farm/${farmId}/histories/${historyId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '이력 삭제에 실패했습니다.');
  }
}
