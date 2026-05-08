/* ════════════════════════════════════════════════════════
   Farm 도메인 API 호출 함수
   BFF(/api/farm)를 통해 백엔드와 통신합니다.
   ════════════════════════════════════════════════════════ */

import { ApiResponse } from '@/lib/constants';
import { 
  FarmListItem, 
  FarmDetail, 
  FarmRegisterPayload, 
  FarmUpdatePayload 
} from './farm.types';

const BASE_URL = '/api/farm';

/**
 * 내 농장 목록 조회
 */
export async function getMyFarms(): Promise<FarmListItem[]> {
  const res = await fetch(BASE_URL, { cache: 'no-store' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '농장 목록을 불러오는데 실패했습니다.');
  }
  const response: ApiResponse<FarmListItem[]> = await res.json();
  return response.data || [];
}

/**
 * 농장 상세 조회
 */
export async function getFarmDetail(id: number): Promise<FarmDetail> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '농장 정보를 불러오는데 실패했습니다.');
  }
  const response: ApiResponse<FarmDetail> = await res.json();
  if (!response.data) throw new Error('농장 데이터가 없습니다.');
  return response.data;
}

/**
 * 농장 등록 신청
 */
export async function registerFarm(payload: FarmRegisterPayload): Promise<{ id: number; pnuCode: string }> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '농장 등록에 실패했습니다.');
  }
  
  const response: ApiResponse<{ id: number; pnuCode: string }> = await res.json();
  if (!response.data) throw new Error('등록 결과 데이터가 없습니다.');
  return response.data;
}

/**
 * 농장 정보 수정
 */
export async function updateFarm(id: number, payload: FarmUpdatePayload): Promise<FarmDetail> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '농장 정보 수정에 실패했습니다.');
  }
  
  const response: ApiResponse<FarmDetail> = await res.json();
  if (!response.data) throw new Error('수정 결과 데이터가 없습니다.');
  return response.data;
}

/**
 * 농장 삭제
 */
export async function deleteFarm(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || '농장 삭제에 실패했습니다.');
  }
}
