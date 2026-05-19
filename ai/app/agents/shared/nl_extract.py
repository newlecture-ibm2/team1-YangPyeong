"""자연어 한국어 메시지에서 구조화된 값을 추출.

LLM이 빈 응답을 반환하는 경우의 키워드 fallback에서, 정규식으로
가격·재고·작물명 같은 핵심 파라미터를 직접 뽑아 도구를 호출할 때 사용한다.

도메인 무관 헬퍼이므로 모든 에이전트가 재사용 가능.
"""
from __future__ import annotations

import re
from typing import Optional

# ── 숫자 + 단위 ──
_PRICE_RE = re.compile(r"([\d,]+)\s*원")
_STOCK_RE = re.compile(r"(\d+)\s*개")

# ── 한글 명사 추출 (우선순위 순서) ──
# 1) 문장 시작 "X을/를 (등록|팔|판매|채우)"
_NOUN_RE_VERB_OBJECT = re.compile(
    r"^\s*([가-힣]{2,10})(?:을|를)\s*(?:등록|팔|판매|채우|구매|주문)"
)
# 2) 문장 시작 "X " + (숫자 | 등록/팔/판매)
_NOUN_RE_WITH_FOLLOWUP = re.compile(
    r"^\s*([가-힣]{2,10})\s+(?:\d|등록|팔|판매)"
)
# 3) 문장 시작 첫 한글 단어 (fallback)
_NOUN_RE_FIRST_WORD = re.compile(r"^\s*([가-힣]{2,10})")

# 작물·상품으로 오인되기 쉬운 일반 단어
_DEFAULT_BLACKLIST: set[str] = {
    "가격", "재고", "카테고리", "설명", "상품", "메뉴", "장터", "장바구니",
    "주문", "결제", "이거", "저거", "그거", "이것", "그것", "내가", "내거",
    "오늘", "내일", "어제", "지금", "여기", "거기", "저기",
}


def extract_price(text: str) -> Optional[int]:
    """'8,800원' 또는 '8800원' 같은 패턴에서 가격(int) 추출."""
    if (m := _PRICE_RE.search(text)):
        try:
            return int(m.group(1).replace(",", ""))
        except ValueError:
            return None
    return None


def extract_stock(text: str) -> Optional[int]:
    """'100개' 같은 패턴에서 재고 수량 추출."""
    if (m := _STOCK_RE.search(text)):
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def _strip_korean_postposition(word: str) -> str:
    """한글 조사(을/를/이/가/는/은/의/로/에) 제거."""
    if len(word) >= 2 and word[-1] in "을를이가는은의로에":
        return word[:-1]
    return word


def extract_korean_noun(
    text: str,
    blacklist: Optional[set[str]] = None,
) -> Optional[str]:
    """문장에서 주된 한글 명사(작물/상품/대상명) 후보를 추출.

    추출 우선순위:
        1. "X을/를 등록/팔/판매/채우/구매/주문" — 가장 신뢰도 높음
        2. "X 100개" / "X 등록" — 첫 단어 + followup
        3. 문장 시작 첫 한글 단어 — 마지막 fallback

    Args:
        text: 사용자 입력 메시지
        blacklist: 명사로 인정하지 않을 단어 집합. 미지정 시 기본 집합 사용.
    """
    bl = blacklist if blacklist is not None else _DEFAULT_BLACKLIST
    text = text.strip()

    # 패턴 1·2: 동사 앞 명사 — 조사 후처리 제거
    for pattern in (_NOUN_RE_VERB_OBJECT, _NOUN_RE_WITH_FOLLOWUP):
        if (m := pattern.search(text)):
            word = _strip_korean_postposition(m.group(1))
            if word and word not in bl and len(word) >= 2:
                return word

    # 패턴 3: 첫 단어 fallback — "오이"의 "이"를 조사로 오인 방지 위해 후처리 X
    if (m := _NOUN_RE_FIRST_WORD.match(text)):
        word = m.group(1)
        if word not in bl and len(word) >= 2:
            return word

    return None


def extract_product_attrs(text: str) -> dict:
    """상품 등록·구매 등에서 사용하는 attribute 일괄 추출.

    Returns:
        {"product_name": ..., "price": ..., "stock": ...} — 추출 실패한 키는 생략
    """
    result: dict = {}
    if (name := extract_korean_noun(text)):
        result["product_name"] = name
    if (price := extract_price(text)) is not None:
        result["price"] = price
    if (stock := extract_stock(text)) is not None:
        result["stock"] = stock
    return result
