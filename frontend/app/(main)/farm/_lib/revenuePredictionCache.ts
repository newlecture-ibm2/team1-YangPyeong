/**
 * 작물별 AI 수익 예측 — sessionStorage 캐시 (당일·농장·작물·면적 기준)
 */

import type { RevenuePredictionResponse } from './revenue.api';

export type RevenueCropRow = {
  cropName: string;
  areaSqm: number;
  sowingMonth?: number;
};

/** 캐시 스키마 변경 시 증가 → 구버전(빈약한 폴백) 자동 무효화 */
export const REVENUE_CACHE_VERSION = 3;

type CachePayload = {
  v: number;
  rowKey: string;
  prediction: RevenuePredictionResponse;
};

const PREFIX = 'fb-revenue-pred';

const WEAK_INSIGHT_MARKERS = [
  'AI 응답을 JSON으로 해석하지 못했습니다',
  '시세가 없어 수익 추정이 불완전합니다',
  '현재 시세 기준 예상 수익은',
  '유효한 시세도 없어',
];

const INSIGHT_MIN_LEN = 20;

/** 예전 폴백·짧은 LLM 응답은 캐시/화면에 쓰지 않음 (AI 서비스 기준과 동일) */
export function isWeakRevenuePrediction(prediction: RevenuePredictionResponse): boolean {
  const priceInsight = (prediction.price_insight || '').trim();
  const revenueInsight = (prediction.revenue_insight || '').trim();

  if (WEAK_INSIGHT_MARKERS.some((m) => priceInsight.includes(m) || revenueInsight.includes(m))) {
    return true;
  }
  if (priceInsight.length < INSIGHT_MIN_LEN || revenueInsight.length < INSIGHT_MIN_LEN) {
    return true;
  }
  const noNumbers =
    (prediction.predicted_price_per_kg ?? 0) <= 0 &&
    (prediction.predicted_revenue ?? 0) <= 0 &&
    (prediction.predicted_yield_kg ?? 0) <= 0;
  if (noNumbers) {
    return true;
  }
  if (prediction.confidence === '낮음' && priceInsight.length < 45 && revenueInsight.length < 45) {
    return true;
  }
  return false;
}

function buildRowKey(row: RevenueCropRow, actualYieldKg?: number): string {
  const y =
    actualYieldKg != null && !Number.isNaN(actualYieldKg) ? `:y${actualYieldKg}` : '';
  return `${row.cropName}:${row.areaSqm}:${row.sowingMonth ?? ''}${y}`;
}

function buildStorageKey(farmId: number, rowKey: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${PREFIX}:v${REVENUE_CACHE_VERSION}:${farmId}:${day}:${rowKey}`;
}

export function readRevenuePredictionCache(
  farmId: number,
  row: RevenueCropRow,
  actualYieldKg?: number,
): RevenuePredictionResponse | null {
  if (typeof sessionStorage === 'undefined') return null;
  const key = buildRowKey(row, actualYieldKg);
  try {
    const raw = sessionStorage.getItem(buildStorageKey(farmId, key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (parsed.v !== REVENUE_CACHE_VERSION || parsed.rowKey !== key) return null;
    if (isWeakRevenuePrediction(parsed.prediction)) return null;
    return parsed.prediction;
  } catch {
    return null;
  }
}

export function writeRevenuePredictionCache(
  farmId: number,
  row: RevenueCropRow,
  prediction: RevenuePredictionResponse,
  actualYieldKg?: number,
): void {
  if (typeof sessionStorage === 'undefined') return;
  if (isWeakRevenuePrediction(prediction)) return;

  const rowKey = buildRowKey(row, actualYieldKg);
  const payload: CachePayload = {
    v: REVENUE_CACHE_VERSION,
    rowKey,
    prediction,
  };
  try {
    sessionStorage.setItem(buildStorageKey(farmId, rowKey), JSON.stringify(payload));
  } catch {
    // quota exceeded 등 — 무시
  }
}

/** 재배 목록에 맞는 유효 캐시만 복원 (LLM 호출 없음) */
export function hydrateRevenuePredictionsFromCache(
  farmId: number,
  rows: RevenueCropRow[],
): Record<string, RevenuePredictionResponse> {
  const out: Record<string, RevenuePredictionResponse> = {};
  for (const row of rows) {
    const cached = readRevenuePredictionCache(farmId, row);
    if (cached) out[row.cropName] = cached;
  }
  return out;
}

/** 대표 작물: 재배 면적이 가장 큰 작물 */
export function pickPrimaryRevenueCrop(rows: RevenueCropRow[]): RevenueCropRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, row) => (row.areaSqm > best.areaSqm ? row : best), rows[0]);
}
