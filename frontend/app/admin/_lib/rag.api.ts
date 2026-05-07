import type {
  ApiResponse,
  RagCategory,
  RagDocument,
  CreateRagCategoryRequest,
  UpdateRagCategoryRequest,
  CreateRagDocumentRequest,
  UpdateRagDocumentRequest,
} from './rag.types'

const BASE = '/api/admin/rag'

// ── 카테고리 ──

export async function fetchCategories(): Promise<RagCategory[]> {
  const res = await fetch(`${BASE}/categories`)
  const json: ApiResponse<RagCategory[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 조회 실패')
  return json.data
}

export async function createCategory(body: CreateRagCategoryRequest): Promise<number> {
  const res = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<number> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 생성 실패')
  return json.data
}

export async function updateCategory(id: number, body: UpdateRagCategoryRequest): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 수정 실패')
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 삭제 실패')
}

// ── 문서 ──

export async function fetchDocuments(categoryId?: number): Promise<RagDocument[]> {
  const query = categoryId ? `?categoryId=${categoryId}` : ''
  const res = await fetch(`${BASE}/documents${query}`)
  const json: ApiResponse<RagDocument[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '문서 조회 실패')
  return json.data
}

export async function createDocument(body: CreateRagDocumentRequest, file?: File): Promise<number> {
  // FILE 타입이고 실제 파일이 있으면 multipart/form-data로 전송
  if (body.contentType === 'FILE' && file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('categoryId', String(body.categoryId))
    formData.append('title', body.title)
    formData.append('contentType', body.contentType)
    if (body.fileType) formData.append('fileType', body.fileType)

    const res = await fetch(`${BASE}/documents`, {
      method: 'POST',
      body: formData,
    })
    const json: ApiResponse<number> = await res.json()
    if (!json.success) throw new Error(json.error?.message ?? '문서 생성 실패')
    return json.data
  }

  // TEXT 타입은 기존 JSON 방식
  const res = await fetch(`${BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<number> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '문서 생성 실패')
  return json.data
}

export async function updateDocument(id: number, body: UpdateRagDocumentRequest): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '문서 수정 실패')
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, { method: 'DELETE' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '문서 삭제 실패')
}
