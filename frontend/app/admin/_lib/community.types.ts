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

/** 관리자용 게시글 페이징 응답 */
export interface PaginatedAdminPosts {
  posts: AdminPost[]
  totalElements: number
  totalPages: number
}

/** 관리자용 댓글 */
export interface AdminComment {
  id: number
  postId: number
  authorId: number
  content: string
  accepted: boolean
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

/** 관리자용 신고 내역 */
export interface AdminReport {
  id: number
  targetType: string // "POST" | "COMMENT"
  targetId: number
  reporterId: number
  reason: string
  status: string // "PENDING" | "RESOLVED" | "DISMISSED"
  createdAt: string
}

export interface PaginatedAdminReports {
  reports: AdminReport[]
  totalElements: number
  totalPages: number
}
