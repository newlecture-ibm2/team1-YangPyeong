import type { ApiResponse, ApiSyncStatus } from './apiSync.types'

const BASE = '/api/admin/api-sync'

/** 전체 API 동기화 상태 목록 조회 */
export async function fetchApiSyncStatuses(): Promise<ApiSyncStatus[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<ApiSyncStatus[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'API 동기화 상태 조회 실패')
  return json.data
}

/** 활성/비활성 토글 */
export async function toggleApiSync(id: number, isActive: boolean): Promise<void> {
  const res = await fetch(`${BASE}/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '상태 변경 실패')
}

/** 수동 동기화 트리거 */
export async function triggerApiSync(id: number, syncMode: 'MERGE' | 'FORCE' = 'MERGE'): Promise<void> {
  const url = new URL(`${BASE}/${id}/trigger`, window.location.origin)
  url.searchParams.append('syncMode', syncMode)

  const res = await fetch(url.toString(), {
    method: 'POST',
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '동기화 트리거 실패')
}

/** 수동 헬스체크 트리거 */
export async function triggerHealthCheck(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}/health-check`, {
    method: 'POST',
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '헬스체크 트리거 실패')
}
