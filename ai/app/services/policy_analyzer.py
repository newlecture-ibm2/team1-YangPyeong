"""
정책 데이터 AI 분석기.
Gemini LLM을 사용하여 비정형 정책 데이터를 정규화합니다.
"""
import json
import logging
import re
from typing import Any

from app.llm import get_llm
from app.models.policy import PolicyAnalyzeResult

logger = logging.getLogger(__name__)

# ── 카테고리 상수 ──
VALID_CATEGORIES = ["보조금", "교육", "임대", "검정", "세금", "융자", "기타"]

# ── Gemini 정규화 프롬프트 ──
ANALYZE_PROMPT_TEMPLATE = """당신은 한국 농업 정책/혜택 데이터를 분석하는 AI 어시스턴트입니다.

아래 정책 데이터를 분석하여 정규화된 JSON을 반환하세요.

## 입력 데이터
- 소스: {source}
- 원문 URL: {source_url}
- 데이터:
{data}

## 출력 JSON 스키마 (반드시 이 형식으로 반환)
{{
  "title": "정책명 (필수, 원본 그대로)",
  "organization": "지원기관명 (없으면 null)",
  "region_code": "지역코드 (양평군=4183, 경기도=41, 전국=0000, 알 수 없으면 null. 4100 같은 임의 코드 사용 금지)",
  "category": "아래 7개 중 하나 (필수)",
  "target": "지원대상 (없으면 null)",
  "content_summary": "지원내용 요약 200자 이내 (필수)",
  "support_amount": "지원금액 또는 규모 (없으면 null)",
  "apply_start": "신청 시작일 yyyy-MM-dd (없으면 null)",
  "apply_end": "신청 마감일 yyyy-MM-dd (없으면 null)",
  "confidence": 0.85,
  "warnings": ["분석 중 발견한 주의사항"]
}}

## category 분류 기준 (반드시 아래 7개 중 하나)
- 보조금: 직접 자금 지원, 보조금, 장려금, 수당
- 교육: 교육 프로그램, 컨설팅, 상담, 멘토링
- 임대: 농기계 임대, 장비 대여, 시설 임대
- 검정: 토양 검정, 수질 검사, 인증, 분석
- 세금: 세금 감면, 면세, 세액 공제
- 융자: 융자, 대출, 저금리 자금
- 기타: 위 6개에 해당하지 않는 경우

## 날짜 파싱 규칙
- "2025년 3월 1일" → "2025-03-01"
- "2025.03.01" → "2025-03-01"
- "25.3.1" → "2025-03-01"
- "상시" 또는 "연중" → null
- "~12월" 같이 연도 없으면 올해 기준으로 추정하고 warnings에 "연도 추정" 추가

## confidence 기준
- 0.90~1.00: 모든 필드가 명확하게 추출됨
- 0.70~0.89: 일부 필드를 추정함
- 0.50~0.69: 다수 필드가 불확실
- 0.50 미만: 데이터 품질이 매우 낮음

## 주의사항
- JSON만 반환하세요. 설명이나 마크다운을 포함하지 마세요.
- 알 수 없는 필드는 null로 설정하세요.
- warnings에 추정한 항목을 반드시 기록하세요.
"""


def _prepare_data_text(raw: dict | None, text: str | None) -> str:
    """입력 데이터를 프롬프트용 텍스트로 변환합니다."""
    if raw:
        return json.dumps(raw, ensure_ascii=False, indent=2)
    if text:
        return text
    return "(데이터 없음)"


def _repair_json(text: str) -> str:
    """깨진 JSON 응답을 복구 시도합니다."""
    # 마크다운 코드블록 제거
    text = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    text = re.sub(r"\n?```\s*$", "", text.strip())

    # 후행 콤마 제거
    text = re.sub(r",\s*([}\]])", r"\1", text)

    return text.strip()


def _validate_and_fix(data: dict) -> dict:
    """분석 결과를 검증하고 보정합니다."""
    warnings = data.get("warnings", [])

    # category 검증
    if data.get("category") not in VALID_CATEGORIES:
        original = data.get("category", "")
        data["category"] = "기타"
        warnings.append(f"카테고리 '{original}' → '기타'로 보정")

    # confidence 범위 보정
    conf = data.get("confidence", 0.5)
    if not isinstance(conf, (int, float)):
        conf = 0.5
        warnings.append("confidence 값 파싱 실패 → 0.5 기본값 적용")
    data["confidence"] = max(0.0, min(1.0, float(conf)))

    # 날짜 형식 검증 (yyyy-MM-dd)
    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    for field in ["apply_start", "apply_end"]:
        val = data.get(field)
        if val and not date_pattern.match(str(val)):
            warnings.append(f"{field} 형식 오류 '{val}' → null 처리")
            data[field] = None

    # title 필수 검증
    if not data.get("title"):
        data["title"] = "(제목 없음)"
        warnings.append("title 누락 → 기본값 적용")

    data["warnings"] = warnings
    return data


async def analyze_policy(
    source: str,
    external_id: str,
    raw: dict | None = None,
    text: str | None = None,
    source_url: str | None = None,
) -> PolicyAnalyzeResult:
    """
    정책 데이터를 AI로 분석하여 정규화된 결과를 반환합니다.

    Args:
        source: 수집 소스 (GOV24, NONGSARO 등)
        external_id: 외부 정책 ID
        raw: API 응답 JSON 원본
        text: 텍스트 원본
        source_url: 원문 링크

    Returns:
        PolicyAnalyzeResult: 정규화된 분석 결과

    Raises:
        ValueError: 분석 실패 시
    """
    data_text = _prepare_data_text(raw, text)

    prompt = ANALYZE_PROMPT_TEMPLATE.format(
        source=source,
        source_url=source_url or "(없음)",
        data=data_text,
    )

    llm = get_llm()

    # 1차 시도: generate_json (structured output)
    try:
        response_text = await llm.generate_json(prompt, temperature=0.1)
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        # JSON 파싱 실패 → repair 시도
        logger.warning(f"[Analyzer] JSON 파싱 실패, repair 시도: {external_id}")
        try:
            repaired = _repair_json(response_text)
            parsed = json.loads(repaired)
        except json.JSONDecodeError:
            # 2차 시도: 일반 generate + repair
            logger.warning(f"[Analyzer] repair 실패, fallback generate 시도: {external_id}")
            response_text2 = await llm.generate(prompt, temperature=0.1)
            repaired2 = _repair_json(response_text2)
            try:
                parsed = json.loads(repaired2)
            except json.JSONDecodeError as e:
                logger.error(f"[Analyzer] 최종 JSON 파싱 실패: {external_id} — {e}")
                raise ValueError(f"AI 응답을 JSON으로 변환할 수 없습니다: {str(e)}")

    # 검증 및 보정
    validated = _validate_and_fix(parsed)

    return PolicyAnalyzeResult(**validated)
