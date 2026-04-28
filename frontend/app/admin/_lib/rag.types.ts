// RAG 카테고리 타입
export interface RagCategory {
  id: number
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

// RAG 문서 타입
export interface RagDocument {
  id: number
  userId: number
  categoryId: number
  title: string
  contentType: 'FILE' | 'TEXT'
  textContent: string | null
  fileUrl: string | null
  fileName: string | null
  fileType: 'PDF' | 'TXT' | 'MD' | 'DOCX' | null
  status: 'ACTIVE' | 'DELETED'
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

// 카테고리 생성 요청
export interface CreateRagCategoryRequest {
  name: string
  description?: string
  displayOrder?: number
}

// 카테고리 수정 요청
export interface UpdateRagCategoryRequest {
  name?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

// 문서 생성 요청
export interface CreateRagDocumentRequest {
  categoryId: number
  title: string
  contentType: 'FILE' | 'TEXT'
  textContent?: string
  fileUrl?: string
  fileName?: string
  fileType?: 'PDF' | 'TXT' | 'MD' | 'DOCX'
}

// 문서 수정 요청
export interface UpdateRagDocumentRequest {
  categoryId?: number
  title?: string
  contentType?: 'FILE' | 'TEXT'
  textContent?: string
  fileUrl?: string
  fileName?: string
  fileType?: 'PDF' | 'TXT' | 'MD' | 'DOCX'
}

// API 공통 응답
export interface ApiResponse<T> {
  success: boolean
  data: T
  error: { code: string; message: string } | null
}
