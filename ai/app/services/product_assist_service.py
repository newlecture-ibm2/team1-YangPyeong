"""
상품 AI 어시스트 서비스.
LLM을 활용하여 상품 설명을 자동 생성하고,
DB 카테고리 목록과 연동하여 전체 필드를 자동 채웁니다.
"""
import json
import logging
import re
from typing import Optional

from sqlalchemy import text

from app.db import get_db_session
from app.llm import get_llm
from app.models.product_assist import AutofillData, ExistingValues, FarmContext, InsightRequest

logger = logging.getLogger(__name__)


# ── DB에서 product_categories 조회 ──

def _fetch_category_names() -> list[str]:
    """product_categories 테이블에서 활성 카테고리명 목록을 조회합니다."""
    session = get_db_session()
    if session is None:
        logger.warning("[ProductAssist] DB 세션 없음 — 기본 카테고리 목록 사용")
        return ["채소", "과일", "곡물", "가공식품", "기타"]

    try:
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
{price_rule}

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
- 단락을 나누어 가독성 좋게 작성하세요. JSON 안에서 줄바꿈은 \\n 이스케이프를 사용하세요.

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


# ── 재배 이력 컨텍스트 프롬프트 (Phase 7) ──

FARM_CONTEXT_BLOCK = """## 판매자의 실제 재배 이력 (아래 팩트를 기반으로 작성하세요)
- 농장: {farm_name} ({address})
- 토양: {soil_info}
- 재배 품종: {crop_name}, 면적 {cultivation_area}㎡
{harvest_block}

## 재배 이력 반영 규칙
- 원산지는 위 농장 주소를 기반으로 "경기도 양평군 ○○면" 형태로 설명에 명시하세요.
- 수확 이력이 있으면 실제 수확량/등급 정보를 설명에 녹여 신뢰감을 주세요.
- 토양 유기물 함량이 높으면 친환경/건강한 토양 관련 내용을 언급하세요.
"""


def _build_farm_context_block(ctx: FarmContext) -> str:
    """FarmContext를 프롬프트에 삽입할 텍스트 블록으로 변환합니다."""
    # 토양 정보 조합
    soil_parts = []
    if ctx.soil_type:
        soil_parts.append(ctx.soil_type)
    if ctx.organic_matter is not None:
        soil_parts.append(f"유기물 {ctx.organic_matter}%")
    soil_info = ", ".join(soil_parts) if soil_parts else "정보 없음"

    # 수확 이력 블록
    harvest_lines = []
    for h in ctx.harvest_records:
        grade_str = f" (등급 {h.grade})" if h.grade else ""
        harvest_lines.append(f"  - {h.harvest_date}: {h.yield_amount}{h.yield_unit}{grade_str}")
    harvest_block = "- 최근 수확 이력:\n" + "\n".join(harvest_lines) if harvest_lines else "- 수확 이력: 아직 없음"

    return FARM_CONTEXT_BLOCK.format(
        farm_name=ctx.farm_name,
        address=ctx.address or "양평군",
        soil_info=soil_info,
        crop_name=ctx.crop_name,
        cultivation_area=ctx.cultivation_area or "미입력",
        harvest_block=harvest_block,
    )


# ── KAMIS 가격 조회 (Phase 7) ──

_CROP_TO_PRODUCT_CATEGORY = {
    # 채소
    "배추": "채소", "양배추": "채소", "시금치": "채소", "상추": "채소", "오이": "채소",
    "호박": "채소", "토마토": "채소", "무": "채소", "당근": "채소", "고추": "채소",
    "마늘": "채소", "양파": "채소", "대파": "채소", "파": "채소", "생강": "채소",
    "감자": "채소", "고구마": "채소", "케일": "채소", "브로콜리": "채소",
    "쑥갓": "채소", "깻잎": "채소", "부추": "채소", "가지": "채소",
    # 과일
    "사과": "과일", "배": "과일", "복숭아": "과일", "포도": "과일", "감귤": "과일",
    "감": "과일", "블루베리": "과일", "수박": "과일", "참외": "과일", "딸기": "과일",
    "자두": "과일", "체리": "과일", "키위": "과일", "매실": "과일",
    # 곡물
    "쌀": "곡물", "벼": "곡물", "보리": "곡물", "밀": "곡물", "콩": "곡물", "팥": "곡물",
    "녹두": "곡물", "참깨": "곡물", "들깨": "곡물", "땅콩": "곡물",
    "옥수수": "곡물", "수수": "곡물", "조": "곡물", "기장": "곡물",
    "잡곡": "곡물", "현미": "곡물", "찹쌀": "곡물",
    # 기타 (버섯·약초)
    "느타리": "기타", "표고버섯": "기타", "표고": "기타", "팽이버섯": "기타",
    "새송이": "기타", "양송이": "기타", "버섯": "기타",
    "인삼": "기타", "도라지": "기타", "더덕": "기타",
}


def infer_product_category(crop_or_product_name: str) -> Optional[str]:
    """작물명(또는 상품명)에서 product_categories 카테고리명을 추론.

    매칭 실패 시 None 반환. _CROP_TO_PRODUCT_CATEGORY 매핑 기반.
    """
    if not crop_or_product_name:
        return None
    # 긴 키워드부터 매칭 (예: '양배추'가 '배추'보다 우선)
    for crop in sorted(_CROP_TO_PRODUCT_CATEGORY.keys(), key=len, reverse=True):
        if crop in crop_or_product_name:
            return _CROP_TO_PRODUCT_CATEGORY[crop]
    return None


def _fetch_kamis_price(product_name: str, farm_context: Optional[FarmContext] = None) -> Optional[dict]:
    """상품명 또는 재배 이력을 통해 매칭되는 작물의 최신 KAMIS 시세를 DB에서 조회합니다."""
    # 알려진 KAMIS 작물명 (긴 이름부터 매칭되도록 정렬)
    KNOWN_CROPS = sorted([
        "쌀", "현미", "찹쌀", "벼", "보리", "밀", "콩", "팥", "녹두",
        "옥수수", "감자", "고구마",
        "배추", "양배추", "시금치", "상추", "수박", "참외", "오이", "호박", "토마토", "딸기", "무", "당근",
        "고추", "마늘", "양파", "대파", "생강", "케일", "브로콜리", "깻잎", "부추", "가지",
        "사과", "배", "복숭아", "포도", "감귤", "감", "블루베리", "자두", "키위", "매실",
        "참깨", "들깨", "땅콩",
        "느타리", "표고버섯", "표고", "팽이버섯", "새송이", "양송이",
    ], key=len, reverse=True)
    
    target_crop = None
    # 1) 재배 이력이 있으면 명확한 작물명 사용
    if farm_context and farm_context.crop_name:
        target_crop = farm_context.crop_name
    # 2) 없으면 상품명에서 키워드 추출
    else:
        for crop in KNOWN_CROPS:
            if crop in product_name:
                target_crop = crop
                break
                
    if not target_crop:
        return None
        
    session = get_db_session()
    if session is None:
        return None
        
    try:
        # DB에서 해당 작물의 최신 시세 1건 조회
        query = text("""
            SELECT price, unit, price_date 
            FROM crop_price_cache 
            WHERE crop_name = :crop_name 
            ORDER BY price_date DESC, id DESC 
            LIMIT 1
        """)
        row = session.execute(query, {"crop_name": target_crop}).fetchone()
        session.close()
        
        if row:
            logger.info("[ProductAssist] KAMIS 가격 캐시 매칭: %s -> %s원/%s", target_crop, row[0], row[1])
            return {
                "crop_name": target_crop,
                "price": row[0],
                "unit": row[1],
                "price_date": str(row[2])
            }
        return None
    except Exception as e:
        logger.error("[ProductAssist] KAMIS 가격 캐시 조회 실패: %s", e)
        if session:
            session.close()
        return None


# ── 전체 자동 채우기 ──

async def autofill_product(
    product_name: str,
    farm_context: Optional[FarmContext] = None,
    existing_values: Optional[ExistingValues] = None,
) -> AutofillData:
    """
    상품명(+ 선택적 농장 재배 이력)으로 카테고리, 가격, 재고, 설명을 AI가 자동 생성합니다.
    카테고리는 DB의 product_categories 테이블에서 조회하여 정확하게 매칭합니다.

    Hybrid 모드: existing_values 가 있으면 해당 필드는 AI가 생성한 값 대신 사용자/DB 값을 유지.

    Args:
        product_name: 상품명
        farm_context: 농장 재배 이력 컨텍스트 (None이면 추론 모드)
        existing_values: 이미 채워진 필드 (덮어쓰지 않음)

    Returns:
        AutofillData: AI가 생성한 전체 상품 정보 (existing_values 우선)

    Raises:
        ValueError: AI 응답 파싱 실패 시
    """
    # DB에서 카테고리 목록 조회
    categories = _fetch_category_names()
    category_list_str = "\n".join(f"- {cat}" for cat in categories)

    # KAMIS 시세 데이터 조회
    kamis_data = _fetch_kamis_price(product_name, farm_context)

    # 사용자가 지정한 단위 (기본 1kg)
    unit_kg = (existing_values.unit_kg if existing_values and existing_values.unit_kg else 1)

    if kamis_data:
        price_rule = (
            f"- 💰 최신 KAMIS 도매 시세 데이터: 작물 [{kamis_data['crop_name']}], {kamis_data['price']}원 / {kamis_data['unit']} (기준일: {kamis_data['price_date']})\n"
            f"- 판매 단위는 {unit_kg}kg 입니다. 위 도매 시세(1kg 기준)에 단위({unit_kg}kg)를 곱한 뒤 소매 마진을 더해 가격을 책정하세요.\n"
            "- 유기농/친환경 인증 제품 등 상품명의 뉘앙스나 소매 마진을 고려해 도매 시세 대비 20~50% 높게 책정하세요.\n"
            "- 100원 단위로 반올림하세요."
        )
    else:
        price_rule = (
            f"- 판매 단위는 {unit_kg}kg 입니다.\n"
            "- 양평군 로컬푸드 직거래 장터의 일반적인 시세를 참고해 시장가를 추정하세요.\n"
            "- 1kg 기준 일반 채소 3,000~10,000원, 과일 5,000~15,000원 수준. 단위에 비례하여 계산.\n"
            "- 유기농/친환경 인증 제품은 일반 제품 대비 20~50% 높게 책정.\n"
            "- 100원 단위로 반올림하세요."
        )

    prompt = AUTOFILL_PROMPT_TEMPLATE.format(
        product_name=product_name,
        category_list=category_list_str,
        price_rule=price_rule,
    )

    # Phase 7: 재배 이력 컨텍스트가 있으면 프롬프트에 추가
    if farm_context:
        farm_block = _build_farm_context_block(farm_context)
        prompt += "\n" + farm_block
        logger.info(
            "[ProductAssist] 재배 이력 연동: 농장='%s', 작물='%s'",
            farm_context.farm_name, farm_context.crop_name,
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
        parsed["unit_kg"] = unit_kg

        # 설명 후처리: 리터럴 \n을 실제 줄바꿈으로 변환 + 길이 보정
        desc = parsed.get("description", "")
        desc = desc.replace("\\n", "\n")  # JSON에서 리터럴 \n으로 온 경우 실제 줄바꿈으로 변환
        parsed["description"] = _truncate_description(desc)
        parsed["is_kamis_applied"] = bool(kamis_data)
        parsed["kamis_unit"] = kamis_data["unit"] if kamis_data else None

        if not parsed["description"]:
            raise ValueError("AI가 설명을 생성하지 못했습니다.")

        # ── Hybrid Overlay: existing_values 가 있는 필드는 사용자/DB 값 우선 ──
        if existing_values:
            if existing_values.category_name:
                parsed["category_name"] = existing_values.category_name
            if existing_values.price is not None and existing_values.price > 0:
                parsed["price"] = existing_values.price
                parsed["is_kamis_applied"] = False  # 사용자 값이므로 KAMIS 마크 해제
            if existing_values.stock is not None and existing_values.stock >= 0:
                parsed["stock"] = existing_values.stock
            if existing_values.description and existing_values.description.strip():
                parsed["description"] = existing_values.description

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


# ── 판매자 인사이트 (신규) ──

INSIGHT_PROMPT_TEMPLATE = """당신은 경기도 양평군의 로컬푸드 온라인 상점 "팜밸런스(FarmBalance)"의 판매자 전용 AI 비즈니스 컨설턴트입니다.

아래는 판매자의 현재 상품 목록 및 판매 데이터입니다.
이를 바탕으로 판매자에게 도움이 될 만한 핵심 통찰(인사이트)과 행동 지침을 한 단락(150~250자)으로 요약해주세요.

## 판매자 상품 데이터
{product_data_text}

## 작성 규칙
1. 따뜻하고 전문적인 존댓말로 작성하세요. 양평군 로컬푸드 판매자임을 감안하세요.
2. 품절(SOLDOUT)이거나 재고가 부족한 상품이 있다면 보충을 제안하세요.
3. 판매량이 높은 효자 상품을 언급하며 격려하거나, 잘 팔리지 않는 상품에 대한 노출/할인 팁을 제시하세요.
4. 마크다운의 굵은 글씨(**텍스트**)를 활용하여 핵심 상품명이나 수치를 강조하세요.
5. 이모지를 2~3개 적절히 사용하세요.
6. 순수한 인사이트 텍스트만 출력하세요. 서론이나 결론 없이 본문만 작성하세요.
"""

async def generate_insight(request: InsightRequest) -> str:
    """
    판매자의 상품 목록을 분석하여 인사이트를 생성합니다.
    """
    if not request.products:
        return "등록된 상품이 없습니다. 첫 양평군 농산물을 등록해 판매를 시작해보세요! 🌱"

    # 상품 데이터를 문자열로 변환
    lines = []
    for p in request.products:
        lines.append(f"- {p.name}: 가격 {p.price}원, 재고 {p.stock}개, 누적판매 {p.salesCount}개, 상태 {p.status}")
    product_data_text = "\n".join(lines)

    prompt = INSIGHT_PROMPT_TEMPLATE.format(product_data_text=product_data_text)
    
    llm = get_llm()
    try:
        insight = await llm.generate(
            prompt,
            temperature=0.7,
            max_tokens=4096,
        )
        insight = insight.strip()
        if not insight:
            raise ValueError("AI가 빈 응답을 반환했습니다.")
            
        logger.info("[ProductAssist] 인사이트 생성 완료 (상품 수: %d)", len(request.products))
        return insight
    except Exception as e:
        logger.error("[ProductAssist] 인사이트 생성 실패 — %s", e)
        raise
