import type { ApiResponse, AdminPost } from './community.types'

const BASE = '/api/admin/community'

export async function fetchPosts(): Promise<AdminPost[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<AdminPost[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '게시글 조회 실패')
  return json.data
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(`${BASE}/${postId}`, { method: 'DELETE' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '게시글 삭제 실패')
}

export async function toggleNotice(postId: number, isNotice: boolean): Promise<void> {
  const res = await fetch(`${BASE}/${postId}/notice`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isNotice }),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '공지 설정 실패')
}
