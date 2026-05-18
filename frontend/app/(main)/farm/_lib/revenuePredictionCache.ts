/**
 * 작물별 AI 수익 예측 — sessionStorage 캐시 (당일·농장·작물·면적 기준)
 */

import type { RevenuePredictionResponse } from './revenue.api';

export type RevenueCropRow = {
  cropName: string;
  areaSqm: number;
  sowingMonth?: number;
};

type CachePayload = {
  rowKey: string;
  prediction: RevenuePredictionResponse;
};

const PREFIX = 'fb-revenue-pred';

function buildRowKey(row: RevenueCropRow, actualYieldKg?: number): string {
  const y =
    actualYieldKg != null && !Number.isNaN(actualYieldKg) ? `:y${actualYieldKg}` : '';
  return `${row.cropName}:${row.areaSqm}:${row.sowingMonth ?? ''}${y}`;
}

function buildStorageKey(farmId: number, rowKey: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${PREFIX}:${farmId}:${day}:${rowKey}`;
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
    if (parsed.rowKey !== key) return null;
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
  const rowKey = buildRowKey(row, actualYieldKg);
  const payload: CachePayload = { rowKey, prediction };
  try {
    sessionStorage.setItem(buildStorageKey(farmId, rowKey), JSON.stringify(payload));
  } catch {
    // quota exceeded 등 — 무시
  }
}

/** 재배 목록에 맞는 캐시만 메모리로 복원 (LLM 호출 없음) */
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
