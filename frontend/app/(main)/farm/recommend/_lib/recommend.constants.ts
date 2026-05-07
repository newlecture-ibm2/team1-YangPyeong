/* ════════════════════════════════════════════════════════
   AI 추천 도메인 — 상수
   ════════════════════════════════════════════════════════ */

/** TOP3 메달 이모지 */
export const MEDALS = ['🥇', '🥈', '🥉'] as const;

/** 카테고리별 이모지 매핑 */
export function getCropEmoji(category: string): string {
  switch (category) {
    case '채소류': return '🥬';
    case '과일류': return '🍅';
    case '곡물':   return '🥔';
    case '특용작물': return '🌿';
    default: return '🌾';
  }
}

/** 재배 캘린더 데이터 */
export interface CalendarPhase {
  label: string;
  startMonth: number;
  endMonth: number;
  color: string;
}

const CALENDAR_MAP: Record<string, CalendarPhase[]> = {
  '유기농 배추': [
    { label: '파종', startMonth: 3, endMonth: 4, color: '#52B788' },
    { label: '육묘', startMonth: 4, endMonth: 5, color: '#74C69D' },
    { label: '정식', startMonth: 5, endMonth: 5, color: '#40916C' },
    { label: '생육', startMonth: 5, endMonth: 7, color: '#2D6A4F' },
    { label: '수확', startMonth: 7, endMonth: 8, color: '#CCFF33' },
  ],
  '청양고추': [
    { label: '파종/육묘', startMonth: 2, endMonth: 4, color: '#52B788' },
    { label: '정식', startMonth: 5, endMonth: 5, color: '#40916C' },
    { label: '생육', startMonth: 5, endMonth: 7, color: '#2D6A4F' },
    { label: '수확', startMonth: 7, endMonth: 10, color: '#CCFF33' },
  ],
  '방울토마토': [
    { label: '파종', startMonth: 2, endMonth: 3, color: '#52B788' },
    { label: '정식', startMonth: 4, endMonth: 4, color: '#40916C' },
    { label: '생육', startMonth: 4, endMonth: 6, color: '#2D6A4F' },
    { label: '수확', startMonth: 5, endMonth: 11, color: '#CCFF33' },
  ],
};

const DEFAULT_CALENDAR: CalendarPhase[] = [
  { label: '파종', startMonth: 3, endMonth: 4, color: '#52B788' },
  { label: '생육', startMonth: 4, endMonth: 7, color: '#2D6A4F' },
  { label: '수확', startMonth: 7, endMonth: 9, color: '#CCFF33' },
];

export function getCropCalendar(cropName: string): CalendarPhase[] {
  return CALENDAR_MAP[cropName] || DEFAULT_CALENDAR;
}

/** 가격 추이 모의 데이터 생성 */
export const PRICE_MONTHS = ['6월', '7월', '8월', '9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월'];

export function generatePriceData(base: number): number[] {
  return PRICE_MONTHS.map((_, i) => {
    const variation = Math.sin((i + base) * 0.8) * 0.2 + (Math.cos(i * 1.3) * 0.1);
    return Math.round(base * (1 + variation));
  });
}
