"""
Shop Agent Tools — 챗봇이 상점 도메인 기능을 수행하기 위한 LangChain 도구 모음.

도구의 출력 문자열에 포함된 "[ACTION:{...json...}]" 토큰은 오케스트레이터에서 추출되어
프론트엔드 디스패처가 실행할 ChatAction으로 변환됩니다.
(see docs/development/chatbot-shop-integration-guide.md §3, §4)
"""
import json
import logging
from typing import Any, Optional
from urllib.parse import urlencode

from langchain_core.tools import tool

from app.agents.shared import action_token as _action, ensure_logged_in, login_required_message
from app.models.product_assist import AutofillData
from app.services.product_assist_service import autofill_product
from app.utils.backend_client import BackendError, call_backend

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════
# 공통 유틸 — app.agents.shared 로 분리됨
#   _action               → action_token (from shared)
#   _login_required_message → login_required_message
#   _ensure_logged_in     → ensure_logged_in
# 하위 호환을 위해 별칭 유지
# ════════════════════════════════════════════════════════

_login_required_message = login_required_message
_ensure_logged_in = ensure_logged_in


# 네비게이션 target → 경로 매핑
_NAV_MAP = {
    "shop_home": "/shop",
    "cart": "/shop/cart",
    "my_orders": "/mypage/history",
    "seller_register": "/mypage/seller/register",
    "seller_products": "/mypage/seller",
    "seller_orders": "/mypage/seller/orders",
}

# 사용자에게 노출할 한국어 라벨 (URL 경로 노출 금지)
_NAV_LABELS = {
    "shop_home": "장터",
    "cart": "장바구니",
    "my_orders": "내 주문 내역",
    "seller_register": "상품 등록 페이지",
    "seller_products": "내 상품 관리 페이지",
    "seller_orders": "판매 주문 관리 페이지",
}


# ════════════════════════════════════════════════════════
# 1. 네비게이션 — 단순 페이지 이동
# ════════════════════════════════════════════════════════

@tool
async def navigate_to(target: str) -> str:
    """사용자가 상점 관련 페이지로 이동을 원할 때 호출합니다.

    Args:
        target: 이동 대상 (다음 중 하나)
            - "shop_home"        장터 메인 (/shop)
            - "cart"             장바구니 (/shop/cart)
            - "my_orders"        내 주문 내역 (/mypage/history)
            - "seller_register"  상품 등록 (/mypage/seller/register)
            - "seller_products"  내가 등록한 상품 관리 (/mypage/seller)
            - "seller_orders"    판매자 주문 관리 (/mypage/seller/orders)
    """
    url = _NAV_MAP.get(target)
    if not url:
        return f"'{target}' 경로를 찾지 못했어요. 다시 한번 말씀해 주실래요?"

    # 로그인 필수 페이지는 비로그인 시 차단
    LOGIN_REQUIRED_TARGETS = {
        "cart", "my_orders", "seller_register", "seller_products", "seller_orders",
    }
    if target in LOGIN_REQUIRED_TARGETS and (msg := _ensure_logged_in()):
        return msg

    label = _NAV_LABELS.get(target, "해당 페이지")
    return f"네, {label}(으)로 이동할게요. " + _action({
        "type": "NAVIGATE", "url": url,
    })


@tool
async def navigate_to_register_page() -> str:
    """[하위 호환] 상품 등록 페이지로 이동. 가능하면 navigate_to("seller_register")를 사용하세요."""
    return await navigate_to.ainvoke({"target": "seller_register"})


# ════════════════════════════════════════════════════════
# 2. 상품 검색 — 모호한 상품명을 ID 후보로 좁히기
# ════════════════════════════════════════════════════════

@tool
async def search_products(keyword: str, category: Optional[str] = None, limit: int = 5) -> str:
    """상품을 키워드로 검색합니다. 사용자가 모호한 상품명을 말했을 때 먼저 호출하여 후보를 좁히세요.

    동작:
        - 1건: 그 상품 정보를 텍스트로 요약
        - 2건 이상: CLARIFY 액션을 반환하여 사용자에게 선택지 제시
        - 0건: 빈 결과 안내

    Args:
        keyword: 검색어 (예: "사과")
        category: (선택) 카테고리명 필터
        limit: 최대 결과 수 (기본 5)
    """
    params = {"keyword": keyword, "page": 0, "size": max(1, min(limit, 20))}
    if category:
        params["category"] = category

    try:
        data = await call_backend("GET", "/api/shop/product", params=params)
    except BackendError as e:
        logger.warning("[ShopTool] search_products 실패: %s", e)
        return f"상품 검색 중 오류가 났어요. ({e.status_code})"

    products = data.get("data") or []
    if not products:
        return f"'{keyword}' 와 맞는 상품을 찾지 못했어요. 다른 단어로 한번 더 말씀해 주실래요?"

    # 1건 → 자동 선택 안내
    if len(products) == 1:
        p = products[0]
        return (
            f"'{p['name']}' 한 가지를 찾았어요. (가격 {p['price']}원, 재고 {p['stock']}개) "
            f"이 상품으로 진행하면 되겠죠? id={p['id']}"
        )

    # 다건 → CLARIFY
    options = [
        {
            "id": p["id"],
            "label": f"{p['name']} ({p['price']}원 / 재고 {p['stock']})",
            "meta": {
                "productId": p["id"],
                "name": p["name"],
                "price": p["price"],
                "stock": p["stock"],
            },
        }
        for p in products[: limit]
    ]
    summary = ", ".join(p["name"] for p in products[:3])
    text = f"'{keyword}'(으)로 {len(products)}개를 찾았어요 ({summary} 등). 어느 상품으로 할까요?"

    return text + " " + _action({
        "type": "CLARIFY",
        "intent": "PICK_PRODUCT",
        "question": text,
        "options": options,
    })


# ════════════════════════════════════════════════════════
# 3. 장바구니 담기
# ════════════════════════════════════════════════════════

@tool
async def add_to_cart(product_id: int, quantity: int = 1) -> str:
    """특정 상품을 장바구니에 담습니다.

    Args:
        product_id: 상품 ID (search_products로 먼저 확정하세요)
        quantity: 담을 수량 (기본 1)

    주의:
        - product_id를 모르면 먼저 search_products를 호출해 사용자에게 선택받으세요.
        - 401(미로그인)이면 로그인 페이지로 NAVIGATE 액션을 반환합니다.
    """
    if (msg := _ensure_logged_in()):
        return msg

    if not product_id or quantity < 1:
        return "상품 ID와 1 이상의 수량이 필요해요."

    try:
        await call_backend(
            "POST",
            "/api/shop/cart",
            json_body={"productId": int(product_id), "quantity": int(quantity)},
        )
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        logger.warning("[ShopTool] add_to_cart 실패: %s", e)
        return f"장바구니에 담지 못했어요. ({e.message})"

    return (
        f"[장바구니 담기 성공] {quantity}개 담았어요. " +
        _action({"type": "TOAST", "level": "success", "message": "장바구니에 담았습니다."}) +
        _action({"type": "REFRESH", "scope": "cart"})
    )


# ════════════════════════════════════════════════════════
# 4. 바로 구매 — 체크아웃 페이지로 이동
# ════════════════════════════════════════════════════════

@tool
async def buy_now(product_id: int, quantity: int = 1) -> str:
    """상품을 장바구니를 거치지 않고 바로 결제 페이지로 이동합니다.

    Args:
        product_id: 상품 ID
        quantity: 수량 (기본 1)
    """
    if (msg := _ensure_logged_in()):
        return msg

    if not product_id or quantity < 1:
        return "상품 ID와 1 이상의 수량이 필요해요."

    # 체크아웃 페이지는 ?productId=&quantity= 쿼리를 지원합니다 (useCheckout.ts 참조)
    query = urlencode({"productId": int(product_id), "quantity": int(quantity)})
    url = f"/shop/checkout?{query}"
    return (
        f"바로 결제 페이지로 안내할게요. ({quantity}개) " +
        _action({"type": "NAVIGATE", "url": url})
    )


# ════════════════════════════════════════════════════════
# 5. 내가 등록한 상품 조회 (판매자)
# ════════════════════════════════════════════════════════

def _summarize_products(products: list[dict[str, Any]], max_items: int = 5) -> str:
    if not products:
        return "등록하신 상품이 아직 없어요."
    head = products[:max_items]
    lines = [
        f"- {p['name']} ({p['price']}원, 재고 {p['stock']}개, 상태 {p.get('status','-')})"
        for p in head
    ]
    extra = f"\n…외 {len(products) - max_items}개" if len(products) > max_items else ""
    return f"등록하신 상품 {len(products)}개 중 일부예요.\n" + "\n".join(lines) + extra


@tool
async def list_my_products() -> str:
    """현재 로그인한 판매자가 등록한 상품 목록을 조회합니다."""
    if (msg := _ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", "/api/shop/seller")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        if e.status_code == 403:
            return "판매자 권한이 필요해요. 농장 인증을 먼저 진행해 주세요."
        return f"내 상품 목록 조회에 실패했어요. ({e.message})"

    products = data.get("data") or []
    summary = _summarize_products(products)
    return summary + " " + _action({"type": "NAVIGATE", "url": "/mypage/seller"})


# ════════════════════════════════════════════════════════
# 6. 판매자 주문 조회
# ════════════════════════════════════════════════════════

_ORDER_STATUS_LABEL = {
    "PENDING": "접수대기",
    "PAID": "결제완료",
    "CONFIRMED": "주문확정",
    "REJECTED": "주문거절",
    "SHIPPED": "배송중",
    "DELIVERED": "배송완료",
    "CANCELLED": "취소",
}


def _summarize_orders(orders: list[dict[str, Any]], max_items: int = 5) -> str:
    if not orders:
        return "들어온 주문이 아직 없어요."
    head = orders[:max_items]
    lines = []
    for o in head:
        item_names = ", ".join(i.get("productName", "") for i in (o.get("items") or [])[:2])
        if len(o.get("items") or []) > 2:
            item_names += " 외"
        status = _ORDER_STATUS_LABEL.get(o.get("status"), o.get("status", "-"))
        lines.append(
            f"- {o.get('orderNumber','-')} | {item_names} | {o.get('totalAmount',0)}원 | {status}"
        )
    extra = f"\n…외 {len(orders) - max_items}건" if len(orders) > max_items else ""
    return f"총 {len(orders)}건의 주문이 있어요.\n" + "\n".join(lines) + extra


@tool
async def list_seller_orders() -> str:
    """판매자에게 들어온 주문 목록을 조회합니다."""
    if (msg := _ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", "/api/shop/seller/order")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        if e.status_code == 403:
            return "판매자 권한이 필요해요."
        return f"주문 목록 조회에 실패했어요. ({e.message})"

    orders = data.get("data") or []
    summary = _summarize_orders(orders)
    return summary + " " + _action({"type": "NAVIGATE", "url": "/mypage/seller/orders"})


# ════════════════════════════════════════════════════════
# 7. 내 주문 조회 (구매자)
# ════════════════════════════════════════════════════════

@tool
async def list_my_orders() -> str:
    """현재 로그인한 사용자(구매자)의 주문 내역을 조회합니다."""
    if (msg := _ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", "/api/shop/order")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"주문 내역 조회에 실패했어요. ({e.message})"

    orders = data.get("data") or []
    summary = _summarize_orders(orders)
    return summary + " " + _action({"type": "NAVIGATE", "url": "/mypage/history"})


# ════════════════════════════════════════════════════════
# 8. 명시적 CLARIFY 도구 — LLM이 정보가 부족할 때 직접 호출
# ════════════════════════════════════════════════════════

@tool
async def clarify(intent: str, question: str, options_json: str) -> str:
    """정보가 부족하여 사용자에게 선택지를 제시해야 할 때 사용합니다.

    Args:
        intent: 후속 처리에 사용할 의도 식별자 (예: "ADD_TO_CART", "BUY_NOW")
        question: 사용자에게 보여줄 질문
        options_json: JSON 배열 문자열. 각 요소는 {"id": ..., "label": "..."} 형태.
            예: '[{"id":1,"label":"부사 사과 1kg"},{"id":2,"label":"홍옥 1kg"}]'
    """
    try:
        options = json.loads(options_json)
        assert isinstance(options, list)
    except Exception:
        return "선택지 형식이 올바르지 않아요."

    return question + " " + _action({
        "type": "CLARIFY",
        "intent": intent,
        "question": question,
        "options": options,
    })


# ════════════════════════════════════════════════════════
# 7-b. 판매 전략 제안 — "잘 팔리는 방법" / "판매 노하우" 용
# ════════════════════════════════════════════════════════

@tool
async def suggest_sales_strategy() -> str:
    """판매자가 '잘 팔리는 방법', '어떻게 팔지', '판매 노하우' 같은
    판매 증대 조언을 요청할 때 호출합니다.

    동작:
        1) 본인이 등록한 상품 목록을 조회
        2) AI 인사이트 서비스가 상품 데이터를 분석해 구체적 판매 전략을 생성
        3) 결과 + 판매자 페이지로 이동 액션 반환
    """
    if (msg := _ensure_logged_in()):
        return msg

    # 1) 본인 상품 조회
    try:
        data = await call_backend("GET", "/api/shop/seller")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        if e.status_code == 403:
            return "판매자 권한이 필요해요. 농장 인증을 먼저 진행해 주세요."
        return f"상품 목록 조회에 실패했어요. ({e.message})"

    products = data.get("data") or []
    if not products:
        return (
            "아직 등록하신 상품이 없어요. 먼저 상품을 등록하면 맞춤 판매 전략을 알려드릴 수 있어요. " +
            _action({"type": "NAVIGATE", "url": "/mypage/seller/register"})
        )

    # 2) AI 인사이트 생성 (이미 마이페이지의 'AI 판매 인사이트'와 동일 로직 재사용)
    from app.services.product_assist_service import generate_insight
    from app.models.product_assist import InsightRequest, SellerProductInfo

    seller_products = [
        SellerProductInfo(
            name=p.get("name", ""),
            price=p.get("price", 0),
            stock=p.get("stock", 0),
            salesCount=p.get("salesCount", 0),
            status=p.get("status", ""),
        )
        for p in products
    ]
    try:
        insight = await generate_insight(InsightRequest(products=seller_products))
    except Exception as e:
        logger.error("[ShopTool] suggest_sales_strategy 인사이트 생성 실패: %s", e)
        return "판매 전략을 분석하는 중 오류가 났어요. 잠시 후 다시 시도해 주세요."

    return (
        insight +
        "\n\n더 자세한 분석과 상품 관리는 판매자 페이지에서 확인하세요. " +
        _action({"type": "NAVIGATE", "url": "/mypage/seller"})
    )


# ════════════════════════════════════════════════════════
# 8-a. "작물 등록" 모호성 해소 — 내 농장 작물 vs 판매 상품
# ════════════════════════════════════════════════════════

@tool
async def clarify_crop_register() -> str:
    """사용자가 '작물 등록', '작물 등록할래' 처럼 모호한 요청을 했을 때 호출합니다.

    '작물 등록'은 두 가지로 해석될 수 있습니다:
      1) 내 농장에 작물을 등록 (내농장 → 작물 추가)
      2) 장터에 판매 상품으로 등록 (마이페이지 → 판매 상품 등록)

    어느 쪽인지 사용자에게 직접 선택받기 위한 CLARIFY 액션을 반환합니다.
    """
    question = "어느 쪽 등록을 말씀하시는 건가요?"
    return question + " " + _action({
        "type": "CLARIFY",
        "intent": "REGISTER_CROP",
        "question": question,
        "options": [
            {"id": "farm_crop", "label": "내 농장에 작물 등록"},
            {"id": "shop_product", "label": "장터에 판매 상품으로 등록"},
        ],
    })


# ════════════════════════════════════════════════════════
# 8-b. 장터 메뉴 TOP 5 — "메뉴 보여줘" / "뭐 팔아?" 용
# ════════════════════════════════════════════════════════

@tool
async def list_shop_menu() -> str:
    """장터(상점)에 등록된 상품 중 판매량 상위 5개를 카드 형식으로 보여줍니다.
    사용자가 "메뉴 보여줘", "뭐 팔아?", "어떤 상품 있어?" 처럼
    전체 상품 목록을 보고 싶을 때 호출하세요.
    """
    try:
        data = await call_backend(
            "GET", "/api/shop/product",
            params={"page": 0, "size": 5, "sort": "bestSelling"},
        )
    except BackendError as e:
        logger.warning("[ShopTool] list_shop_menu 실패: %s", e)
        # 백엔드 접근 불가 시 장터 페이지로 이동 안내
        return "장터 상품 목록을 불러오지 못했어요. 장터 페이지에서 직접 확인해 보세요! " + _action({
            "type": "NAVIGATE", "url": "/shop",
        })

    products: list[dict] = data.get("data") or []
    if not products:
        return "현재 등록된 상품이 없어요. 장터 페이지에서 확인해 보세요! " + _action({
            "type": "NAVIGATE", "url": "/shop",
        })

    # PRODUCT_LIST 액션 — 프론트가 카드로 렌더링
    product_items = [
        {
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "stock": p["stock"],
            "salesCount": p.get("salesCount"),
            "imageUrl": (p.get("imageUrls") or [None])[0],
            "categoryName": p.get("categoryName"),
        }
        for p in products[:5]
    ]

    return (
        f"장터에서 인기 있는 상품 {len(product_items)}가지예요. "
        "더 많은 상품은 장터에서 확인하세요! " +
        _action({"type": "PRODUCT_LIST", "products": product_items}) +
        _action({"type": "NAVIGATE", "url": "/shop"})
    )


# ════════════════════════════════════════════════════════
# 9. 장바구니 조회
# ════════════════════════════════════════════════════════

@tool
async def get_my_cart() -> str:
    """현재 로그인한 사용자의 장바구니 목록을 조회합니다.
    사용자가 "장바구니 뭐 있어?", "내 장바구니 확인해줘" 처럼 요청할 때 호출하세요.
    """
    if (msg := _ensure_logged_in()):
        return msg

    try:
        data = await call_backend("GET", "/api/shop/cart")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        logger.warning("[ShopTool] get_my_cart 실패: %s", e)
        return f"장바구니를 불러오지 못했어요. ({e.message})"

    items: list[dict] = data if isinstance(data, list) else (data.get("data") or [])
    if not items:
        return (
            "장바구니가 비어 있어요. 마음에 드는 상품을 담아보세요! " +
            _action({"type": "NAVIGATE", "url": "/shop/cart"})
        )

    total_amount = 0
    lines = []
    product_items = []
    for item in items:
        product = item.get("product") or {}
        name = product.get("name") or f"상품 #{item.get('productId', '?')}"
        price = product.get("price", 0)
        qty = item.get("quantity", 1)
        subtotal = price * qty
        total_amount += subtotal
        lines.append(f"- {name} {qty}개 ({price:,}원 × {qty} = {subtotal:,}원)")
        image_urls = product.get("imageUrls") or []
        product_items.append({
            "id": item.get("productId"),
            "name": name,
            "price": price,
            "stock": product.get("stock"),
            "imageUrl": image_urls[0] if image_urls else None,
            "quantity": qty,
        })

    summary = "\n".join(lines)
    return (
        f"장바구니에 {len(items)}개 상품이 있어요. (합계 {total_amount:,}원)\n{summary}\n"
        "결제하시겠어요? " +
        _action({"type": "PRODUCT_LIST", "products": product_items}) +
        _action({"type": "NAVIGATE", "url": "/shop/cart"})
    )


# ════════════════════════════════════════════════════════
# 10. 주문 취소 요청
# ════════════════════════════════════════════════════════

# 취소 가능한 주문 상태 (결제 전/직후)
_CANCELLABLE_STATUSES = {"PENDING", "PAID"}
_CANCELLABLE_LABEL = {"PENDING": "접수대기", "PAID": "결제완료"}


@tool
async def cancel_order(order_number: Optional[str] = None, keyword: Optional[str] = None) -> str:
    """사용자가 주문을 취소하고 싶을 때 호출합니다.

    동작:
        - order_number 지정 시 → 해당 주문을 찾아 ORDERED 상태면 즉시 API 취소 처리
        - order_number 미지정 시 → 취소 가능한 주문 목록을 조회하여 CLARIFY 제시

    취소 가능 조건: 판매자가 아직 접수하지 않은 'ORDERED(결제완료)' 상태만 즉시 취소 가능.
    그 이상(배송준비중·배송중·완료)은 취소 불가.

    Args:
        order_number: (선택) 취소할 주문번호 (예: "ORD-20240519-001")
        keyword: (선택) 상품명으로 취소할 때 사용 (예: "딸기", "사과")
    """
    if (msg := _ensure_logged_in()):
        return msg

    # 주문 목록 조회
    try:
        data = await call_backend("GET", "/api/shop/order")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        logger.warning("[ShopTool] cancel_order 주문 조회 실패: %s", e)
        return f"주문 내역을 불러오지 못했어요. ({e.message})"

    orders: list[dict] = data.get("data") or []
    if not orders:
        return "취소할 주문이 없어요. 주문 내역이 비어 있습니다."

    # ── 주문번호 지정된 경우: 즉시 API 취소 ──
    if order_number:
        target = next(
            (o for o in orders if o.get("orderNumber", "").lower() == order_number.lower()),
            None,
        )
        if not target:
            return (
                f"'{order_number}' 주문을 찾지 못했어요. 주문번호를 다시 확인해 주세요. " +
                _action({"type": "NAVIGATE", "url": "/mypage/history"})
            )

        status = target.get("status", "")
        status_label = _ORDER_STATUS_LABEL.get(status, status)

        if str(status).upper() != "ORDERED":
            return (
                f"'{order_number}' 주문은 현재 '{status_label}' 상태라 취소할 수 없어요. "
                "판매자가 이미 접수한 주문은 취소가 불가합니다. "
                "자세한 문의는 판매자에게 연락해 주세요. " +
                _action({"type": "NAVIGATE", "url": "/mypage/history"})
            )

        # ORDERED → API 취소
        try:
            await call_backend("PATCH", f"/api/shop/order/{target['id']}/cancel")
        except BackendError as e:
            if e.status_code == 400:
                return "판매자가 이미 접수하여 취소할 수 없는 상태예요. 판매자에게 직접 문의해 주세요."
            logger.warning("[ShopTool] cancel_order API 실패: %s", e)
            return f"취소 처리 중 오류가 났어요. ({e.message})"

        items_summary = ", ".join(
            i.get("productName", "") for i in (target.get("items") or [])[:2]
        )
        more = f" 외 {len(target.get('items', [])) - 2}건" if len(target.get('items', [])) > 2 else ""
        return (
            f"'{order_number}' 주문({items_summary}{more})이 취소되었어요. "
            f"({target.get('totalAmount', 0):,}원) " +
            _action({"type": "TOAST", "level": "success", "message": "주문이 취소되었습니다."}) +
            _action({"type": "NAVIGATE", "url": "/mypage/history"})
        )

    # ── 주문번호 미지정: 취소 가능 목록 조회 후 CLARIFY ──
    # [디버깅 로직 추가] 백엔드가 반환하는 실제 status 값을 로그로 확인
    logger.info("[ShopTool] cancel_order - 전체 주문 목록: %s", [{o.get("id"): o.get("status")} for o in orders])

    # 판매자 미접수 상태인 'ORDERED' 주문만 취소 가능 (백엔드 정책)
    cancellable = [
        o for o in orders 
        if str(o.get("status")).upper() == "ORDERED"
    ]
    
    if keyword and not order_number:
        # 키워드가 있으면 해당 키워드가 포함된 상품이 있는 주문만 필터링
        filtered = []
        for o in cancellable:
            items = o.get("items") or []
            if any(keyword.lower() in str(i.get("productName", "")).lower() for i in items):
                filtered.append(o)
        
        # 키워드 필터링 후 0건이면 필터링 전의 전체 cancellable을 유지하거나, 없다고 안내
        if filtered:
            cancellable = filtered

    if not cancellable:
        return (
            "현재 취소 가능한 주문이 없어요. "
            "취소는 결제완료(주문접수) 상태일 때만 가능합니다. " +
            _action({"type": "NAVIGATE", "url": "/mypage/history"})
        )

    if len(cancellable) == 1:
        # 1건이면 바로 취소
        o = cancellable[0]
        items_summary = ", ".join(i.get("productName", "") for i in (o.get("items") or [])[:2])
        try:
            await call_backend("PATCH", f"/api/shop/order/{o['id']}/cancel")
        except BackendError as e:
            return f"취소 처리 중 오류가 났어요. ({e.message})"
        return (
            f"'{o['orderNumber']}' 주문({items_summary}, {o.get('totalAmount', 0):,}원)이 취소되었어요. " +
            _action({"type": "TOAST", "level": "success", "message": "주문이 취소되었습니다."}) +
            _action({"type": "NAVIGATE", "url": "/mypage/history"})
        )

    # 다건 → CLARIFY로 어느 주문 취소할지 선택
    options = []
    for o in cancellable[:5]:
        items_summary = ", ".join(i.get("productName", "") for i in (o.get("items") or [])[:2])
        more = f" 외 {len(o.get('items', [])) - 2}건" if len(o.get('items', [])) > 2 else ""
        options.append({
            "id": o["orderNumber"],
            "label": f"{o['orderNumber']} | {items_summary}{more} | {o.get('totalAmount', 0):,}원",
        })
    question = f"취소 가능한 주문이 {len(cancellable)}건 있어요. 어느 주문을 취소할까요?"
    return question + " " + _action({
        "type": "CLARIFY",
        "intent": "CANCEL_ORDER",
        "question": question,
        "options": options,
    })


# ════════════════════════════════════════════════════════
# 11. 상품 상세 조회
# ════════════════════════════════════════════════════════

@tool
async def get_product_detail(product_id: Optional[int] = None, product_name: Optional[str] = None) -> str:
    """특정 상품의 상세 정보를 조회합니다.
    사용자가 "토마토 상세 보여줘", "이 상품 정보 알려줘" 처럼 요청할 때 호출하세요.

    Args:
        product_id: 상품 ID (확정된 경우)
        product_name: 상품명 (ID를 모를 때. 먼저 search_products로 ID를 확인하는 것을 권장)
    """
    # product_id 없으면 이름으로 검색 후 단건이면 자동 진행
    if not product_id and product_name:
        try:
            search_data = await call_backend(
                "GET", "/api/shop/product",
                params={"keyword": product_name, "page": 0, "size": 5},
            )
        except BackendError as e:
            return f"상품 검색 중 오류가 났어요. ({e.message})"

        products = search_data.get("data") or []
        if not products:
            return f"'{product_name}' 상품을 찾지 못했어요. 다른 이름으로 검색해 보실래요?"
        if len(products) == 1:
            product_id = products[0]["id"]
        else:
            # 다건 → CLARIFY
            options = [
                {"id": p["id"], "label": f"{p['name']} ({p['price']:,}원)"}
                for p in products[:5]
            ]
            question = f"'{product_name}'(으)로 여러 상품을 찾았어요. 어느 상품 상세를 볼까요?"
            return question + " " + _action({
                "type": "CLARIFY",
                "intent": "GET_PRODUCT_DETAIL",
                "question": question,
                "options": options,
            })

    if not product_id:
        return "어떤 상품의 상세 정보가 필요하신가요? 상품명을 말씀해 주세요."

    try:
        data = await call_backend("GET", f"/api/shop/product/{int(product_id)}")
    except BackendError as e:
        if e.status_code == 404:
            return "해당 상품을 찾지 못했어요. 이미 삭제되었거나 판매 종료된 상품일 수 있어요."
        logger.warning("[ShopTool] get_product_detail 실패: %s", e)
        return f"상품 정보를 불러오지 못했어요. ({e.message})"

    p = data.get("data") or data  # 단건은 data 필드 또는 루트에 위치
    name = p.get("name", "?")
    price = p.get("price", 0)
    stock = p.get("stock", 0)
    description = p.get("description", "")
    category = p.get("categoryName", "")
    seller = p.get("sellerName", "")
    sales_count = p.get("salesCount", 0)
    status = p.get("status", "")
    image_urls: list = p.get("imageUrls") or []

    status_map = {
        "AVAILABLE": "판매중",
        "SOLD_OUT": "품절",
        "SUSPENDED": "판매중지",
        "PENDING": "검수중",
    }
    status_label = status_map.get(status, status)

    detail_lines = [
        f"📦 **{name}**",
        f"가격: {price:,}원 | 재고: {stock}개 | 판매량: {sales_count}개",
        f"카테고리: {category} | 판매자: {seller} | 상태: {status_label}",
    ]
    if description:
        # 너무 길면 앞부분만
        desc_preview = description[:100] + ("…" if len(description) > 100 else "")
        detail_lines.append(f"설명: {desc_preview}")

    product_card = {
        "id": p.get("id"),
        "name": name,
        "price": price,
        "stock": stock,
        "imageUrl": image_urls[0] if image_urls else None,
        "salesCount": sales_count,
        "categoryName": category,
    }

    return (
        "\n".join(detail_lines) + " " +
        _action({"type": "PRODUCT_LIST", "products": [product_card]}) +
        _action({"type": "NAVIGATE", "url": f"/shop/{p.get('id')}"})
    )


# ════════════════════════════════════════════════════════
# 12. 장바구니에서 선택 결제
# ════════════════════════════════════════════════════════

def _split_keywords(text: str) -> list[str]:
    """'쌀이랑 감자', '쌀, 감자', '쌀하고 감자' 등에서 키워드를 분리."""
    import re
    # 조사/접속사로 분리: 이랑, 랑, 과, 와, 하고, 그리고, 및, ','
    parts = re.split(r"[,\s]*(?:이랑|랑|이랑|과|와|하고|그리고|및)\s*|,\s*", text)
    # 공백·조사 제거 후 비어있지 않은 것만
    cleaned = [re.sub(r"[을를은는이가도]$", "", p.strip()) for p in parts]
    return [k for k in cleaned if k]


def _match_cart_items(cart_items: list[dict], keywords: list[str]) -> list[dict]:
    """키워드 목록과 장바구니 항목 이름을 비교해 매칭되는 항목 반환.

    매칭 기준:
        - 키워드가 상품명에 포함 (예: "쌀" → "햇쌀 10kg" 매칭)
        - 또는 상품명이 키워드에 포함 (예: "햇쌀" → "쌀" 키워드로 매칭)
    """
    matched = []
    for item in cart_items:
        product = item.get("product") or {}
        name = product.get("name", "")
        for kw in keywords:
            if kw in name or name in kw:
                matched.append(item)
                break
    return matched


@tool
async def buy_selected_from_cart(keywords: str) -> str:
    """장바구니에 담긴 상품 중 사용자가 지정한 것만 골라 결제합니다.

    '거기서 쌀이랑 감자만 주문해줘', '장바구니에서 사과하고 배만 결제할게' 처럼
    장바구니 내 특정 상품만 선택해서 주문하려 할 때 사용합니다.

    Args:
        keywords: 주문할 상품명(들). 쉼표·'이랑'·'하고' 등으로 구분 가능.
            예: "쌀, 감자" / "사과이랑 배" / "햇쌀"
    """
    if (msg := _ensure_logged_in()):
        return msg

    try:
        data = await call_backend("GET", "/api/shop/cart")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        logger.warning("[ShopTool] buy_selected_from_cart 장바구니 조회 실패: %s", e)
        return f"장바구니를 불러오지 못했어요. ({e.message})"

    cart_items: list[dict] = data if isinstance(data, list) else (data.get("data") or [])
    if not cart_items:
        return "장바구니가 비어 있어요. 먼저 상품을 담아주세요."

    kw_list = _split_keywords(keywords)
    if not kw_list:
        return "어떤 상품을 주문할지 말씀해 주세요."

    matched = _match_cart_items(cart_items, kw_list)

    if not matched:
        available = ", ".join(
            (item.get("product") or {}).get("name", "?") for item in cart_items[:5]
        )
        return (
            f"장바구니에서 '{keywords}'에 해당하는 상품을 찾지 못했어요. "
            f"현재 장바구니: {available}"
        )

    # 매칭된 항목의 cart item id 수집 (checkout은 cartIds 쿼리로 필터링)
    cart_ids = ",".join(str(item["id"]) for item in matched)
    url = f"/shop/checkout?cartIds={cart_ids}"

    matched_names = ", ".join((item.get("product") or {}).get("name", "?") for item in matched)
    total = sum(
        (item.get("product") or {}).get("price", 0) * item.get("quantity", 1)
        for item in matched
    )
    return (
        f"{matched_names} ({total:,}원) 결제 페이지로 안내할게요. " +
        _action({"type": "NAVIGATE", "url": url})
    )


# ════════════════════════════════════════════════════════
# 13. 상품 정보 자동 채우기 (기존 + NAVIGATE 보강)
# ════════════════════════════════════════════════════════

@tool
async def autofill_product_info(
    product_name: str,
    price: Optional[int] = None,
    stock: Optional[int] = None,
    category_name: Optional[str] = None,
    description: Optional[str] = None,
) -> str:
    """특정 작물명(예: 옥수수, 배추)으로 상품 등록 폼을 자동 채웁니다.

    사용자가 가격·재고·카테고리·설명 중 일부를 명시했다면 해당 값을 그대로 우선 사용하고,
    명시하지 않은 항목만 AI가 생성한 값으로 채웁니다. (사용자 입력 > AI 생성)

    Args:
        product_name: 작물명 (필수, 예: "배추")
        price: 사용자가 지정한 판매가(원). 미지정 시 AI 추천가 사용.
        stock: 사용자가 지정한 재고 수량. 미지정 시 AI 추천값 사용.
        category_name: 사용자가 지정한 카테고리명. 미지정 시 AI 분류 결과 사용.
        description: 사용자가 직접 작성한 상품 설명. 미지정 시 AI 생성 설명 사용.
    """
    if (msg := _ensure_logged_in()):
        return msg
    try:
        data: AutofillData = await autofill_product(product_name)
    except Exception as e:
        logger.error("[ShopTool] autofill_product_info 실패: %s", e)
        return f"상품 정보 자동 채우기 중 오류가 났어요: {e}"

    # 사용자 명시값 우선, 없으면 AI 생성값 사용
    final_price = price if price is not None else data.price
    final_stock = stock if stock is not None else data.stock
    final_category = category_name or data.category_name
    final_description = description or data.description

    fill_payload = {
        "name": product_name,
        "price": final_price,
        "stock": final_stock,
        "categoryName": final_category,
        "description": final_description,
        "isKamisApplied": data.is_kamis_applied,
        "kamisUnit": data.kamis_unit,
    }

    # 사용자 입력 반영 안내 메시지 (어떤 항목을 사용자 값으로 썼는지 표시)
    user_set = []
    if price is not None: user_set.append(f"가격 {price}원")
    if stock is not None: user_set.append(f"재고 {stock}개")
    if category_name: user_set.append(f"카테고리 {category_name}")
    if description: user_set.append("설명")
    user_note = (
        f" (말씀하신 {', '.join(user_set)}은(는) 그대로 반영했어요.)"
        if user_set else " 가격/재고는 원하시는 대로 수정하세요."
    )

    return (
        f"'{product_name}' 상품 정보를 자동으로 채워드렸어요.{user_note} " +
        _action({"type": "NAVIGATE", "url": "/mypage/seller/register"}) +
        _action({"type": "FILL_FORM", "target": "seller_register", "payload": fill_payload})
    )
