"""
상품 AI 어시스트 서비스.
LLM을 활용하여 상품 설명을 자동 생성하고,
DB 카테고리 목록과 연동하여 전체 필드를 자동 채웁니다.
"""
import json
import logging
import re
from typing import Optional

from app.db import get_db_session
from app.llm import get_llm
from app.models.product_assist import AutofillData

logger = logging.getLogger(__name__)


# ── DB에서 product_categories 조회 ──

def _fetch_category_names() -> list[str]:
    """product_categories 테이블에서 활성 카테고리명 목록을 조회합니다."""
    session = get_db_session()
    if session is None:
        logger.warning("[ProductAssist] DB 세션 없음 — 기본 카테고리 목록 사용")
        return ["채소", "과일", "곡물", "가공식품", "기타"]

    try:
        from sqlalchemy import text
        rows = session.execute(
            text("SELECT name FROM product_categories WHERE is_active = true ORDER BY display_order")
        ).fetchall()
        session.close()

        names = [row[0] for row in rows]
        if not names:
            logger.warning("[ProductAssist] product_categories 비어있음 — 기본 목록 사용")
            return ["채소", "과일", "곡물", "가공식품", "기타"]

        logger.info("[ProductAssist] DB 카테고리 로드: %s", names)
        return names
    except Exception as e:
        logger.error("[ProductAssist] 카테고리 조회 실패: %s", e)
        if session:
            session.close()
        return ["채소", "과일", "곡물", "가공식품", "기타"]


# ── 상품 설명 생성 프롬프트 (기존) ──

DESCRIPTION_PROMPT_TEMPLATE = """당신은 경기도 양평군의 로컬푸드 온라인 상점 "팜밸런스(FarmBalance)"의 상품 설명 작성 전문가입니다.

아래 상품 정보를 바탕으로, 구매자의 마음을 끌 수 있는 매력적인 상품 설명을 작성해주세요.

## 상품 정보
- 상품명: {product_name}
- 카테고리: {category_name}

## 작성 규칙
1. 반드시 400~500자 분량으로 충분히 길고 자세하게 작성하세요.
2. 아래 내용을 모두 포함하세요:
   - 양평군의 청정 자연환경(맑은 물, 깨끗한 공기, 비옥한 토양) 소개
   - 해당 작물의 맛, 식감, 영양소 등 장점
   - 추천 요리법이나 활용법 (예: 쌈, 샐러드, 볶음 등)
   - 보관 방법이나 신선도 유지 팁
   - 구매를 유도하는 따뜻한 마무리 한 줄
3. 따뜻하고 친근한 존댓말로 작성하세요.
4. 이모지를 3~5개 적절히 사용하세요.
5. 마크다운이나 HTML 태그를 사용하지 마세요. 순수 텍스트만 작성하세요.
6. 줄바꿈을 활용하여 가독성 좋게 작성하세요.

## 출력
상품 설명만 출력하세요. 다른 설명이나 메타 정보는 포함하지 마세요.
"""


# ── 전체 자동 채우기 프롬프트 (신규) ──

AUTOFILL_PROMPT_TEMPLATE = """당신은 경기도 양평군의 로컬푸드 온라인 상점 "팜밸런스(FarmBalance)"의 상품 등록 AI 어시스턴트입니다.

판매자가 입력한 상품명을 바탕으로, 나머지 상품 정보를 자동으로 채워주세요.

## 입력
- 상품명: {product_name}

## DB에 등록된 카테고리 목록 (반드시 아래 중 하나 선택)
{category_list}

## 출력 형식
반드시 아래와 같은 **순수 JSON 한 줄**만 반환하세요.
절대 마크다운 코드블록(```)이나 설명 텍스트를 포함하지 마세요.

{{"category_name": "채소", "price": 8000, "stock": 30, "description": "상품 설명 텍스트"}}

## 규칙

### 카테고리
- 반드시 위 카테고리 목록 중 하나를 선택하세요.

### 가격 (price)
- 양평군 로컬푸드 직거래 장터의 일반적인 시세를 참고하세요.
- 소포장(500g~1kg)은 3,000~15,000원, 대용량(3kg~5kg)은 15,000~40,000원 수준.
- 유기농/친환경 인증 제품은 일반 제품 대비 20~50% 높게 책정.
- 100원 단위로 반올림하세요.

### 재고 (stock)
- 신선 채소/과일: 20~50개
- 곡물/가공식품: 30~100개
- 계절 한정 상품: 10~30개

### 상품 설명 (description)
- 반드시 400~500자 분량으로 충분히 길고 자세하게 작성하세요.
- 아래 내용을 모두 포함하세요:
  1. 양평군의 청정 자연환경(맑은 물, 깨끗한 공기, 비옥한 토양) 소개
  2. 해당 작물의 맛, 식감, 영양소 등 장점
  3. 추천 요리법이나 활용법 (예: 쌈, 샐러드, 볶음 등)
  4. 보관 방법이나 신선도 유지 팁
  5. 구매를 유도하는 따뜻한 마무리 한 줄
- 따뜻하고 친근한 존댓말로 작성하세요.
- 이모지를 3~5개 적절히 사용하세요.
- 마크다운/HTML 태그 금지, 순수 텍스트만.
- 중요: description 값 안에서 줄바꿈이 필요하면 반드시 문자 그대로의 \\n을 사용하세요. 실제 개행 문자를 넣지 마세요.

## 절대 규칙
1. 순수 JSON 객체 하나만 반환하세요. 다른 텍스트를 절대 포함하지 마세요.
2. price는 정수(int)로 반환하세요.
3. stock은 정수(int)로 반환하세요.
4. description 안에 큰따옴표(")를 사용하지 마세요. 작은따옴표(')로 대체하세요.
"""


def _repair_json(text: str) -> str:
    """깨진 JSON 응답을 복구 시도합니다."""
    # 마크다운 코드블록 제거
    text = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    text = re.sub(r"\n?```\s*$", "", text.strip())
    # JSON 객체만 추출 시도
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        text = match.group(0)
    # trailing comma 제거
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return text.strip()


def _truncate_description(desc: str, max_len: int = 800) -> str:
    """설명을 max_len 이내로 자릅니다."""
    desc = desc.strip().strip('"').strip("'")
    if len(desc) <= max_len:
        return desc

    truncated = desc[:max_len - 3]
    last_punct = max(
        truncated.rfind('.'),
        truncated.rfind('!'),
        truncated.rfind('?'),
        truncated.rfind('~'),
    )
    if last_punct > max_len // 2:
        return truncated[:last_punct + 1]
    return truncated + "..."


# ── 상품 설명 생성 (기존) ──

async def generate_product_description(
    product_name: str,
    category_name: str,
) -> str:
    """
    상품명과 카테고리를 기반으로 AI 상품 설명을 생성합니다.

    Args:
        product_name: 상품명
        category_name: 카테고리명

    Returns:
        생성된 상품 설명 텍스트 (500자 이내)

    Raises:
        ValueError: LLM 응답이 비어있거나 파싱 실패 시
    """
    prompt = DESCRIPTION_PROMPT_TEMPLATE.format(
        product_name=product_name,
        category_name=category_name,
    )

    llm = get_llm()

    try:
        description = await llm.generate(
            prompt,
            temperature=0.8,
            max_tokens=8192,  # 2.5-flash thinking 토큰 소비 대비 넉넉히
        )
        description = _truncate_description(description)

        if not description:
            raise ValueError("AI가 빈 응답을 반환했습니다.")

        logger.info(
            "[ProductAssist] 설명 생성 완료: '%s' (%s) → %d자",
            product_name, category_name, len(description),
        )
        return description

    except Exception as e:
        logger.error(
            "[ProductAssist] 설명 생성 실패: '%s' (%s) — %s",
            product_name, category_name, e,
        )
        raise


# ── 전체 자동 채우기 (신규) ──

async def autofill_product(product_name: str) -> AutofillData:
    """
    상품명만으로 카테고리, 가격, 재고, 설명을 AI가 자동 생성합니다.
    카테고리는 DB의 product_categories 테이블에서 조회하여 정확하게 매칭합니다.

    Args:
        product_name: 상품명

    Returns:
        AutofillData: AI가 생성한 전체 상품 정보

    Raises:
        ValueError: AI 응답 파싱 실패 시
    """
    # DB에서 카테고리 목록 조회
    categories = _fetch_category_names()
    category_list_str = "\n".join(f"- {cat}" for cat in categories)

    prompt = AUTOFILL_PROMPT_TEMPLATE.format(
        product_name=product_name,
        category_list=category_list_str,
    )

    llm = get_llm()

    try:
        response_text = await llm.generate(
            prompt,
            temperature=0.5,  # 정확한 매칭을 위해 낮은 온도
            max_tokens=8192,  # 2.5-flash는 thinking 토큰도 이 예산에서 소비하므로 넉넉히
        )

        logger.debug("[ProductAssist] Gemini raw response: %s", repr(response_text[:500]))

        # JSON 파싱 (repair 포함)
        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError:
            repaired = _repair_json(response_text)
            logger.debug("[ProductAssist] Repaired JSON: %s", repr(repaired[:500]))
            parsed = json.loads(repaired)

        # 카테고리 검증: DB 목록에 없으면 가장 유사한 것 또는 첫 번째로 대체
        if parsed.get("category_name") not in categories:
            original = parsed.get("category_name", "")
            # 부분 매칭 시도
            matched = next((c for c in categories if c in original or original in c), None)
            parsed["category_name"] = matched or categories[0]
            logger.warning(
                "[ProductAssist] 카테고리 보정: '%s' → '%s'",
                original, parsed["category_name"],
            )

        # 가격/재고 정수 보정
        parsed["price"] = max(100, int(parsed.get("price", 5000)))
        # 100원 단위로 반올림
        parsed["price"] = round(parsed["price"] / 100) * 100
        parsed["stock"] = max(1, int(parsed.get("stock", 30)))

        # 설명 길이 보정
        parsed["description"] = _truncate_description(
            parsed.get("description", "")
        )

        if not parsed["description"]:
            raise ValueError("AI가 설명을 생성하지 못했습니다.")

        result = AutofillData(**parsed)

        logger.info(
            "[ProductAssist] Autofill 완료: '%s' → 카테고리=%s, 가격=%d, 재고=%d, 설명=%d자",
            product_name, result.category_name, result.price, result.stock,
            len(result.description),
        )
        return result

    except json.JSONDecodeError as e:
        logger.error("[ProductAssist] Autofill JSON 파싱 실패: %s — %s", product_name, e)
        raise ValueError(f"AI 응답을 파싱할 수 없습니다: {str(e)}")
    except Exception as e:
        logger.error("[ProductAssist] Autofill 실패: %s — %s", product_name, e)
        raise
