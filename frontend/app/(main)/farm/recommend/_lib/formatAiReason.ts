/**
 * AI 추천 사유(aiReason) 평문 → 화면용 문단·강조 구조화
 * (DB/LLM 응답은 대개 5~7문장 한 덩어리 평문)
 */

export interface AiReasonSection {
  title: string;
  sentences: string[];
}

const THEME_RULES: { title: string; keywords: RegExp }[] = [
  { title: '토양·필지 환경', keywords: /토양|필지|pH|사양토|유기물|밭|점토|배수|산성|알칼/i },
  { title: '시세·수익 전망', keywords: /시세|수익|가격|단가|도매|경쟁력|수확량|kg|톤|원\/kg/i },
  { title: '수급·판로', keywords: /수급|공급|수요|과잉|부족|판로|출하|시장|양평군/i },
  { title: '재배·관리', keywords: /재배|파종|수확|병해충|관수|시비|윤작|난이도|하우스|관리/i },
];

/** 문장 분리 (한국어 마침표·줄바꿈·번호 목록) */
export function splitAiReasonSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const fromNewlines = trimmed
    .split(/\n{2,}|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const block of fromNewlines) {
    const numbered = block.split(/(?=\s*(?:\d{1,2}[.)]|[•·▪-])\s+)/).map((s) => s.trim()).filter(Boolean);
    for (const piece of numbered) {
      const cleaned = piece.replace(/^\s*\d{1,2}[.)]\s*|^[•·▪-]\s*/, '').trim();
      if (!cleaned) continue;
      const parts = cleaned.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter((s) => s.length > 4);
      chunks.push(...(parts.length > 0 ? parts : [cleaned]));
    }
  }

  if (chunks.length > 0) return chunks;

  return trimmed
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
}

function scoreSentenceTheme(sentence: string): number[] {
  return THEME_RULES.map(({ keywords }) => (keywords.test(sentence) ? 1 : 0));
}

/** 주제별 섹션 그룹 (매칭 없으면 2문장 단위 문단) */
export function buildAiReasonSections(text: string): AiReasonSection[] {
  const sentences = splitAiReasonSentences(text);
  if (sentences.length === 0) return [];

  const buckets: string[][] = THEME_RULES.map(() => []);
  const unassigned: string[] = [];

  for (const sentence of sentences) {
    const scores = scoreSentenceTheme(sentence);
    const max = Math.max(...scores);
    if (max === 0) {
      unassigned.push(sentence);
      continue;
    }
    const idx = scores.indexOf(max);
    buckets[idx].push(sentence);
  }

  const sections: AiReasonSection[] = [];
  THEME_RULES.forEach((rule, i) => {
    if (buckets[i].length > 0) {
      sections.push({ title: rule.title, sentences: buckets[i] });
    }
  });

  if (unassigned.length > 0) {
    if (sections.length === 0) {
      for (let i = 0; i < unassigned.length; i += 2) {
        sections.push({
          title: i === 0 ? '종합 의견' : '',
          sentences: unassigned.slice(i, i + 2),
        });
      }
    } else {
      sections.push({ title: '추가 참고', sentences: unassigned });
    }
  }

  if (sections.length === 0) {
    return [{ title: '종합 의견', sentences }];
  }

  return sections;
}

/** 아코디언 헤더용 한 줄 요약 */
export function summarizeAiReason(text: string, maxLen = 140): string {
  const first = splitAiReasonSentences(text)[0] ?? text.trim();
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen) + '…';
}

/** 강조할 토큰 (숫자·지표·핵심 키워드) */
const EMPHASIS_PATTERN =
  /(\d+(?:\.\d+)?\s*(?:%|점|kg|톤|㎡|ha)?|pH\s*[\d.]+\s*(?:~\s*[\d.]+)?|토양\s*적합|시세\s*전망|수급\s*안정|수익(?:률)?|공급\s*과잉|공급\s*부족)/gi;

export type AiReasonTextPart = { type: 'text' | 'emphasis'; value: string };

export function parseEmphasisParts(sentence: string): AiReasonTextPart[] {
  const parts: AiReasonTextPart[] = [];
  let last = 0;
  const re = new RegExp(EMPHASIS_PATTERN.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(sentence)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: sentence.slice(last, match.index) });
    }
    parts.push({ type: 'emphasis', value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < sentence.length) {
    parts.push({ type: 'text', value: sentence.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', value: sentence }];
}
