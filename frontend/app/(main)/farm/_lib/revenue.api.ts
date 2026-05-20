/**
 * 수익 예측 API (AI Agent 연동)
 */

export interface RevenuePredictionRequest {
  crop_name: string;
  area_sqm: number;
  sowing_month?: number;
  actual_yield_kg?: number;
  weather_context?: string;
  farm_id?: number;
}

export interface RevenuePredictionResponse {
  crop_name: string;
  area_sqm: number;
  predicted_yield_kg: number;
  predicted_price_per_kg: number;
  predicted_revenue: number;
  yield_factors: {
    planting_time_impact?: string;
    weather_impact?: string;
    overall_adjustment?: string;
  };
  price_insight: string;
  revenue_insight: string;
  confidence: string;
}

export async function getFarmRevenuePredictions(
  farmId: number,
): Promise<RevenuePredictionResponse[]> {
  const response = await fetch(`/api/revenue/farms/${farmId}/predictions`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || '수익 예측 이력 조회에 실패했습니다.');
  }

  return result.data ?? [];
}

export async function predictRevenue(request: RevenuePredictionRequest): Promise<RevenuePredictionResponse> {
  const response = await fetch('/api/revenue/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || '수익 예측에 실패했습니다.');
  }

  return result.data;
}
