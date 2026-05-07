/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateString ISO 날짜 문자열
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // 날짜가 유효하지 않은 경우 원본 반환
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
