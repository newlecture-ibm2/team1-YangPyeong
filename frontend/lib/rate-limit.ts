/**
 * 서버 사이드 메모리 기반 Rate Limiter (BFF Route Handler 전용).
 * 향후 Redis 기반으로 교체 가능.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const _buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000; // 메모리 상한

export function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): boolean {
  const now = Date.now();
  const existing = _buckets.get(key);

  if (!existing || existing.resetAt < now) {
    // 오래된 키가 많으면 가장 오래된 것부터 제거
    if (_buckets.size >= MAX_KEYS) {
      const firstKey = _buckets.keys().next().value;
      if (firstKey) _buckets.delete(firstKey);
    }
    _buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}
