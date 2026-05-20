export interface BalanceAnalysisResponse {
  cropName: string;
  baseYear: number;
  supplyRatio: number;
  status: 'EXCESS_WARN' | 'EXCESS_CAUTION' | 'BALANCED' | 'SHORT_CAUTION' | 'SHORT_WARN' | 'UNKNOWN';
  statusLabel: string;
  message: string;
}

export async function fetchBalanceAnalysis(cropName: string, year?: number): Promise<BalanceAnalysisResponse> {
  const url = year ? `/api/balance/${encodeURIComponent(cropName)}?year=${year}` : `/api/balance/${encodeURIComponent(cropName)}`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || '수급 분석 데이터를 불러오는데 실패했습니다.');
  }

  return result.data;
}

export async function fetchAllBalances(year?: number): Promise<BalanceAnalysisResponse[]> {
  const url = year ? `/api/balance?year=${year}` : `/api/balance`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || '전체 수급 데이터를 불러오는데 실패했습니다.');
  }

  return result.data;
}

export interface SupplyTrendResult {
  year: number;
  supply: number;
  demand: number;
  ratio: number;
  status: string;
}

export async function fetchSupplyTrend(cropName: string): Promise<SupplyTrendResult[]> {
  const url = `/api/balance/${encodeURIComponent(cropName)}/trend`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || '수급 추이 데이터를 불러오는데 실패했습니다.');
  }

  return result.data;
}

// ========== 읍면동 대시보드 ==========

export interface TownInfo {
  code: string;
  name: string;
}

export interface CropSupplyItem {
  cropName: string;
  currentSupplyKg: number;
  standardYieldKg: number;
  supplyRatio: number;
  status: string;
  statusLabel: string;
}

export interface SupplySummary {
  label: string;
  farmCount: number;
  crops: CropSupplyItem[];
}

export interface BalanceDashboardData {
  userTowns: TownInfo[];
  selectedTownCode: string | null;
  selectedTownName: string;
  townSummary: SupplySummary;
  totalSummary: SupplySummary;
}

export async function fetchBalanceDashboard(townCode?: string): Promise<BalanceDashboardData> {
  const url = townCode
    ? `/api/balance/dashboard?townCode=${encodeURIComponent(townCode)}`
    : `/api/balance/dashboard`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || '대시보드 데이터를 불러오는데 실패했습니다.');
  }

  return result.data;
}

