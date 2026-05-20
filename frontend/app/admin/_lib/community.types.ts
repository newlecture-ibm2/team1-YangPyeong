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
  isHidden: boolean
  statusReason: string | null
  commentCount: number
}

/** 관리자용 게시글 페이징 응답 */
export interface PaginatedAdminPosts {
  posts: AdminPost[]
  totalElements: number
  totalPages: number
}

export interface PaginatedAdminComments {
  comments: AdminComment[]
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
  isHidden: boolean
  statusReason: string | null
}

/** 관리자용 그룹화된 신고 내역 */
export interface AdminGroupedReport {
  targetType: string // "POST" | "COMMENT"
  targetId: number
  reportCount: number
  recentReason: string
  status: string // "PENDING" | "RESOLVED" | "DISMISSED"
  recentReportAt: string
}

export interface PaginatedAdminReports {
  reports: AdminGroupedReport[]
  totalElements: number
  totalPages: number
}
