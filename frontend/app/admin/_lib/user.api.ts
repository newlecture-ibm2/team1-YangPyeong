import type {
  ApiResponse,
  UserListResponse,
  ChangeRoleRequest,
  ChangeStatusRequest,
} from './user.types'

const BASE = '/api/admin/users'

/** 사용자 목록 조회 (검색 + 필터 + 페이징) */
export async function fetchUsers(params: {
  keyword?: string
  role?: string
  status?: string
  page?: number
  size?: number
}): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.role && params.role !== 'ALL') query.set('role', params.role)
  if (params.status && params.status !== 'ALL') query.set('status', params.status)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))

  const res = await fetch(`${BASE}?${query.toString()}`)
  const json: ApiResponse<UserListResponse> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '사용자 목록 조회 실패')
  return json.data
}

/** 역할 변경 */
export async function changeUserRole(id: number, body: ChangeRoleRequest): Promise<void> {
  const res = await fetch(`${BASE}/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '역할 변경 실패')
}

/** 상태 변경 (정지/재활성화) */
export async function changeUserStatus(id: number, body: ChangeStatusRequest): Promise<void> {
  const res = await fetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '상태 변경 실패')
}

/** 강제 탈퇴 (제재) */
export async function forceWithdrawUser(id: number, reasonType: string, reasonDetail: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reasonType, reasonDetail }),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '강제 탈퇴 처리에 실패했습니다.')
}

/** 수동 복구 */
export async function reactivateUser(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '수동 복구에 실패했습니다.')
}
