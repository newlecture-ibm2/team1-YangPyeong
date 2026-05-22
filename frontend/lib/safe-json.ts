/* ════════════════════════════════════════════════════════
   BFF 공통 — 안전 JSON 파싱 유틸리티

   백엔드가 빈 body 또는 비-JSON 응답을 반환할 때
   JSON.parse 에러를 방지합니다.
   ════════════════════════════════════════════════════════ */

/**
 * Response 객체에서 안전하게 JSON을 파싱합니다.
 *
 * - 빈 body → null 반환
 * - JSON 파싱 실패 → null 반환 + 간결한 로그
 *
 * @param res - fetch Response 객체
 * @param label - 로그용 식별자 (예: '/admin/dashboard')
 */
export async function safeJsonParse(
  res: Response,
  label?: string,
): Promise<Record<string, unknown> | null> {
  const text = await res.text();

  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const preview = text.length > 80 ? text.substring(0, 80) + '…' : text;
    console.warn(
      `[BFF] JSON 파싱 실패 (${label ?? 'unknown'}, status=${res.status}): ${preview}`,
    );
    return null;
  }
}
