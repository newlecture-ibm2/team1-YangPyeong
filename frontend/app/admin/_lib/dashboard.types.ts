export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

export interface CropAreaStat {
  cropName: string
  totalArea: number
}

export interface SeedSalesStat {
  seedName: string
  salesCount: number
}

export interface CropBalanceStat {
  cropName: string
  ratio: number
  status: string
}

export interface AdminDashboard {
  pendingFarmApprovals: number
  pendingReports: number
  activeUsers: number
  weeklyNewOrders: number
  topCropsByArea: CropAreaStat[]
  topSeedsBySales: SeedSalesStat[]
  balanceStatusDistribution: { [key: string]: number }
  excessRiskCrops: CropBalanceStat[]
  shortageRiskCrops: CropBalanceStat[]
}
