export interface AdminBalanceData {
  id: number;
  regionCode: string;
  cropId: number;
  cropName: string;
  year: number;
  season: string;
  supplyForecast: number;
  demandForecast: number;
  supplyRatio: number;
  balanceStatus: string;
  calculatedAt: string;
}

export interface BalanceThresholdsDto {
  excessWarn: number;
  excessCaution: number;
  shortCaution: number;
  shortWarn: number;
}

export async function fetchBalanceData(): Promise<AdminBalanceData[]> {
  const res = await fetch('/api/admin/balance-engine/data');
  if (!res.ok) throw new Error('Failed to fetch balance data');
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch balance data');
  return data.data;
}

export async function fetchThresholds(): Promise<BalanceThresholdsDto> {
  const res = await fetch('/api/admin/balance-engine/properties');
  if (!res.ok) throw new Error('Failed to fetch thresholds');
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch thresholds');
  return data.data;
}

export async function updateThresholds(thresholds: BalanceThresholdsDto): Promise<void> {
  const res = await fetch('/api/admin/balance-engine/properties', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thresholds)
  });
  if (!res.ok) throw new Error('Failed to update thresholds');
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to update thresholds');
}
