/** crop_cultivation_env 시드와 동일한 파종·수확 fallback (단일 출처) */

export function normCropName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

export interface CropPeriodFallbackRow {
  match: (n: string) => boolean;
  sowing: string;
  harvest: string;
}

export const CROP_PERIOD_FALLBACK: CropPeriodFallbackRow[] = [
  { match: (n) => n.includes('쌀') || n.includes('벼'), sowing: '4월순 ~ 5월순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('보리'), sowing: '10월순 ~ 10월순', harvest: '5월순 ~ 6월중순' },
  { match: (n) => n.includes('콩'), sowing: '6월중순 ~ 7월순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('감자'), sowing: '3월순 ~ 4월순', harvest: '6월중순 ~ 7월순' },
  { match: (n) => n.includes('고구마'), sowing: '4월순 ~ 5월중순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('방울'), sowing: '3월 ~ 4월(정식)', harvest: '5월 ~ 11월' },
  { match: (n) => n.includes('토마토'), sowing: '3월 ~ 4월(정식)', harvest: '5월 ~ 9월' },
  { match: (n) => n.includes('고추') || n.includes('피망'), sowing: '2월(정식) ~ 5월(정식)', harvest: '7월 ~ 10월' },
  { match: (n) => n.includes('배추') || n.includes('양배추'), sowing: '3월 ~ 5월', harvest: '7월 ~ 8월' },
  { match: (n) => n.includes('인삼'), sowing: '8월 ~ 9월(정식)', harvest: '12월 ~ 5월' },
];

export function resolveCropPeriodFallback(cropName: string): { sowing?: string; harvest?: string } {
  const n = normCropName(cropName);
  for (const row of CROP_PERIOD_FALLBACK) {
    if (row.match(n)) return { sowing: row.sowing, harvest: row.harvest };
  }
  return {};
}
