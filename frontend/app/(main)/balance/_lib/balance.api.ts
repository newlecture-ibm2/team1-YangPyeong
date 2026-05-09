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
