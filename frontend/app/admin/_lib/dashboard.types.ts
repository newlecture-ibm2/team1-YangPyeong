/** API 공통 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

/** 관리자 대시보드 KPI 데이터 */
export interface AdminDashboard {
  totalUsers: number
  totalFarmers: number
  pendingApprovals: number
  totalFarms: number
  totalCrops: number
  totalPosts: number
  totalProducts: number
  totalOrders: number
  todayRegistrations: number
}
