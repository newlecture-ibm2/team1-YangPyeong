/* ── 농부 승인/반려 타입 정의 ── */

export interface FarmApprovalView {
  farmId: number
  farmName: string
  address: string
  areaSize: number
  businessNumber: string | null
  landCertImageUrl: string | null
  landCertVerified: boolean
  status: ApprovalStatus
  createdAt: string

  userId: number
  userName: string
  userEmail: string
  userPhone: string | null
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: {
    code: string
    message: string
  } | null
}

/** 상태 한글 매핑 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '승인대기',
  APPROVED: '승인완료',
  REJECTED: '반려',
}
