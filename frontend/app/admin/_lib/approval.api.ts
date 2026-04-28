import type { ApiResponse, FarmApprovalView } from './approval.types'

const BASE = '/api/admin/approvals'

/** 상태별 승인 요청 목록 조회 */
export async function fetchApprovals(status: string): Promise<FarmApprovalView[]> {
  const res = await fetch(`${BASE}?status=${status}`)
  const json: ApiResponse<FarmApprovalView[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '승인 목록 조회 실패')
  return json.data
}

/** 농장 승인 */
export async function approveFarm(farmId: number): Promise<void> {
  const res = await fetch(`${BASE}/${farmId}/approve`, { method: 'PATCH' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '승인 처리 실패')
}

/** 농장 반려 */
export async function rejectFarm(farmId: number): Promise<void> {
  const res = await fetch(`${BASE}/${farmId}/reject`, { method: 'PATCH' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '반려 처리 실패')
}
