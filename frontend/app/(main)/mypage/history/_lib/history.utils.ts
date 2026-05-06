/* ════════════════════════════════════════════════════════
   구매자 주문내역 — 유틸리티 함수
   ════════════════════════════════════════════════════════ */

/** 가격 포맷 (₩1,000) */
export const formatPrice = (price: number) =>
  `₩${price.toLocaleString('ko-KR')}`;

/** 날짜 포맷 (2026.05.04) */
export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

