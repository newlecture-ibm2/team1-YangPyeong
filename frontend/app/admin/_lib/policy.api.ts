import type { ApiResponse, AdminPolicyData, PolicyDataRequest } from './policy.types'

const BASE = '/api/admin/policy'

export async function fetchPolicies(): Promise<AdminPolicyData[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<AdminPolicyData[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '정책 조회 실패')
  return json.data
}

export async function createPolicy(body: PolicyDataRequest): Promise<number> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<{ id: number }> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '정책 등록 실패')
  return json.data.id
}

export async function updatePolicy(id: number, body: PolicyDataRequest): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '정책 수정 실패')
}

export async function deletePolicy(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '정책 삭제 실패')
}
