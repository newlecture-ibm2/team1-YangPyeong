"""Shop 도메인 슬롯 추출기.

`slot_resolver` 레지스트리에 등록되어, 다중 턴 슬롯 채우기 시 사용된다.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Optional

from app.agents.shared.nl_extract import extract_korean_noun, extract_price, extract_stock
from app.utils.backend_client import BackendError, call_backend

logger = logging.getLogger(__name__)

# 1글자 상품명 허용을 위해 실제 장바구니/판매자 상품과 매칭
_NOISE_WORDS = ("장바구니의", "장바구니에서", "장바구니에", "장바구니",
                 "지금", "그니까", "그러니까", "이제", "좀", "다시",
                 "물량", "수량", "재고", "개수")


def _clean_noise(text: str) -> str:
    cleaned = text
    for n in _NOISE_WORDS:
        cleaned = cleaned.replace(n, " ")
    return re.sub(r"\s+", " ", cleaned).strip()


async def extract_product_name(user_message: str, filled: dict[str, Any]) -> Optional[str]:
    """상품명 슬롯 추출.

    1) 노이즈 제거 후 표준 명사 추출 (2글자 이상)
    2) 실패 시 1글자 한글 후보를 실제 장바구니/판매자 상품과 매칭
    """
    cleaned = _clean_noise(user_message)
    # 1차: 표준 추출
    if (name := extract_korean_noun(cleaned)):
        return name
    # 2차: 1글자 후보 + 백엔드 매칭
    candidates = [c for c in re.findall(r"[가-힣]+", cleaned)
                  if c not in ("개로", "개", "응", "네", "맞아", "그래")]
    if not candidates:
        return None
    try:
        cart = await call_backend("GET", "/api/shop/cart")
        cart_items = cart if isinstance(cart, list) else (cart.get("data") or [])
    except BackendError:
        cart_items = []
    try:
        seller = await call_backend("GET", "/api/shop/seller")
        seller_products = seller.get("data") or []
    except BackendError:
        seller_products = []

    names = [
        *(((it.get("product") or {}).get("name", "") or "") for it in cart_items),
        *((p.get("name", "") or "") for p in seller_products),
    ]
    for cand in candidates:
        for nm in names:
            if cand and cand in nm:
                return cand
    return candidates[0]  # 매칭 실패해도 후보 반환


def extract_quantity(user_message: str, filled: dict[str, Any]) -> Optional[int]:
    """수량 슬롯 추출 ('N개' / 단독 숫자도 허용)."""
    if (v := extract_stock(user_message)) is not None:
        return v
    # "3개로", "3" 같은 단독 숫자
    m = re.search(r"(\d+)", user_message)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def extract_price_slot(user_message: str, filled: dict[str, Any]) -> Optional[int]:
    """가격 슬롯 추출 ('N원')."""
    if (v := extract_price(user_message)) is not None:
        return v
    # 단순 숫자라도 허용 (사용자가 "8000" 만 입력했을 때)
    m = re.search(r"(\d{2,})", user_message.replace(",", ""))
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def extract_description(user_message: str, filled: dict[str, Any]) -> Optional[str]:
    """상품 설명 슬롯 추출 — 따옴표 우선, 없으면 전체 메시지."""
    m = re.search(r'["\'""](.+?)["\'""]', user_message)
    if m:
        return m.group(1).strip()
    # 따옴표 없으면 메시지 전체 사용 (단순한 케이스)
    text = user_message.strip()
    return text if text else None


def extract_order_number(user_message: str, filled: dict[str, Any]) -> Optional[str]:
    """주문번호 추출 (ORD-XXX-YYY 패턴)."""
    m = re.search(r"ord-\d+-[a-z0-9]+", user_message.lower())
    return m.group(0).upper() if m else None


def register() -> None:
    """슬롯 추출기와 도구를 레지스트리에 등록."""
    from app.agents.shared.slot_resolver import register_slot_extractors
    from app.agents.shared.tool_dispatcher import register_tools
    from app.agents.tools.shop_tools import (
        update_cart_qty,
        remove_from_cart,
        update_product,
        delete_product,
        change_product_status,
        cancel_order,
        track_my_order,
        add_to_cart,
    )

    register_slot_extractors("shop", {
        "product_name": extract_product_name,
        "quantity": extract_quantity,
        "price": extract_price_slot,
        "stock": extract_quantity,  # 재고도 수량과 같은 추출기
        "description": extract_description,
        "order_number": extract_order_number,
    })

    register_tools({
        "update_cart_qty": update_cart_qty,
        "remove_from_cart": remove_from_cart,
        "update_product": update_product,
        "delete_product": delete_product,
        "change_product_status": change_product_status,
        "cancel_order": cancel_order,
        "track_my_order": track_my_order,
        "add_to_cart": add_to_cart,
    })
