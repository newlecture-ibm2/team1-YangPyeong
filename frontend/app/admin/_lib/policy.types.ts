export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

/** 관리자용 정책 데이터 */
export interface AdminPolicyData {
  id: number
  externalId: string
  title: string | null
  category: string | null
  organization: string | null
  regionCode: string | null
  regionName: string | null
  target: string | null
  supportAmount: string | null
  applyStart: string | null
  applyEnd: string | null
  contentSummary: string | null
  sourceUrl: string | null
  fetchedAt: string | null
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

/** 정책 생성/수정 요청 */
export interface PolicyDataRequest {
  externalId: string
  title: string | null
  category: string | null
  organization: string | null
  regionCode: string | null
  target: string | null
  supportAmount: string | null
  applyStart: string | null
  applyEnd: string | null
  contentSummary: string | null
  sourceUrl: string | null
}
