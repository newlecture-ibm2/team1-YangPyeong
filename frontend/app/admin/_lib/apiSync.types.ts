/** API 공통 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

/** API 동기화 상태 */
export interface ApiSyncStatus {
  id: number
  apiName: string
  displayName: string
  lastSynced: string | null
  lastHealthChecked: string | null
  syncStatus: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  lastRecordCount: number | null
  errorMessage: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}
