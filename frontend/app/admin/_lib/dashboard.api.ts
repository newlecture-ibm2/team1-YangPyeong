import type { ApiResponse, AdminDashboard } from './dashboard.types'

const BASE = '/api/admin/dashboard'

/** 대시보드 KPI 조회 */
export async function fetchDashboard(): Promise<AdminDashboard> {
  const res = await fetch(BASE)
  const json: ApiResponse<AdminDashboard> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '대시보드 조회 실패')
  return json.data
}
