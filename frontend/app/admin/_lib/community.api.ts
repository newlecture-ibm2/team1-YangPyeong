import type { ApiResponse, AdminPost } from './community.types'

const BASE = '/api/admin/community'

export async function fetchPosts(params: { keyword?: string; status?: string; page?: number; size?: number } = {}): Promise<import('./community.types').PaginatedAdminPosts> {
  const qs = new URLSearchParams()
  if (params.keyword) qs.append('keyword', params.keyword)
  if (params.status) qs.append('status', params.status)
  if (params.page !== undefined) qs.append('page', String(params.page))
  if (params.size !== undefined) qs.append('size', String(params.size))

  const res = await fetch(`${BASE}?${qs.toString()}`)
  const json: ApiResponse<import('./community.types').PaginatedAdminPosts> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '게시글 조회 실패')
  return json.data
}

export async function fetchPostDetail(postId: number): Promise<AdminPost> {
  const res = await fetch(`${BASE}/${postId}`)
  const json: ApiResponse<AdminPost> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '게시글 상세 조회 실패')
  return json.data
}

export async function fetchComments(postId: number): Promise<import('./community.types').AdminComment[]> {
  const res = await fetch(`${BASE}/${postId}/comments`)
  const json: ApiResponse<import('./community.types').AdminComment[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '댓글 조회 실패')
  return json.data
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await fetch(`${BASE}/comments/${commentId}`, { method: 'DELETE' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '댓글 삭제 실패')
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

export async function createNotice(data: { title: string; content: string; categoryId: number }): Promise<void> {
  const res = await fetch(`${BASE}/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '공지 작성 실패')
}
