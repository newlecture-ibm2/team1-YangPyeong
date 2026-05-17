/* ════════════════════════════════════════════════════════
   AI 추천 도메인 — 상수
   ════════════════════════════════════════════════════════ */

/** TOP3 메달 이모지 */
export const MEDALS = ['🥇', '🥈', '🥉'] as const;

/** 작물명 → 이모지 (개별 매핑) */
const CROP_EMOJI_MAP: Record<string, string> = {
  // 채소류
  '배추': '🥬', '유기농 배추': '🥬', '봄배추': '🥬', '가을배추': '🥬',
  '고추': '🌶️', '청양고추': '🌶️', '풋고추': '🌶️', '홍고추': '🌶️',
  '상추': '🥬', '양상추': '🥬',
  '시금치': '🥬',
  '당근': '🥕',
  '양파': '🧅',
  '마늘': '🧄',
  '오이': '🥒',
  '호박': '🎃', '애호박': '🎃', '단호박': '🎃',
  '무': '🥕', '총각무': '🥕',
  '파': '🌿', '대파': '🌿', '쪽파': '🌿',
  '브로콜리': '🥦',
  '가지': '🍆',
  '옥수수': '🌽',
  '피망': '🫑', '파프리카': '🫑',
  '생강': '🫚',
  // 과일류
  '토마토': '🍅', '방울토마토': '🍅',
  '딸기': '🍓',
  '수박': '🍉',
  '참외': '🍈', '멜론': '🍈',
  '사과': '🍎',
  '배': '🍐',
  '포도': '🍇',
  '감': '🍊', '단감': '🍊',
  '복숭아': '🍑',
  '자두': '🍑',
  '블루베리': '🫐',
  '감귤': '🍊', '귤': '🍊',
  // 곡물
  '감자': '🥔',
  '고구마': '🍠',
  '벼': '🌾', '쌀': '🌾',
  '콩': '🫘', '대두': '🫘', '강낭콩': '🫘',
  '보리': '🌾',
  '밀': '🌾',
  '조': '🌾', '수수': '🌾', '기장': '🌾',
  // 특용작물
  '인삼': '🌿',
  '들깨': '🌿', '참깨': '🌿',
  '녹차': '🍵',
  '약초': '🌿',
};

/** 카테고리 → 기본 이모지 (폴백) */
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  '채소류': '🥬',
  '과일류': '🍎',
  '곡물': '🌾',
  '특용작물': '🌿',
  '화훼류': '💐',
};

/** 작물명 우선 매핑 → 카테고리 폴백 */
export function getCropEmoji(category: string, cropName?: string): string {
  if (cropName) {
    // 정확 매칭
    if (CROP_EMOJI_MAP[cropName]) return CROP_EMOJI_MAP[cropName];
    // 부분 매칭 (예: "유기농 배추" 에서 "배추" 검색)
    for (const [key, emoji] of Object.entries(CROP_EMOJI_MAP)) {
      if (cropName.includes(key)) return emoji;
    }
  }
  return CATEGORY_EMOJI_MAP[category] ?? '🌱';
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
