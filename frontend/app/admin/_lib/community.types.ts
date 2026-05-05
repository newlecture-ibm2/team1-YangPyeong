export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

/** 관리자용 게시글 */
export interface AdminPost {
  id: number
  authorId: number
  categoryId: number
  title: string
  content: string
  viewCount: number
  isNotice: boolean
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}
