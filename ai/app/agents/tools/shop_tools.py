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
from app.agents.shared.action_token import pending_intent_token as _pending
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

    # 1건 → 자동 선택 안내 (product_id는 내부 메타로만, 사용자에게는 미노출)
    if len(products) == 1:
        p = products[0]
        unit_kg = p.get("unitKg") or 1
        unit_suffix = f" / {unit_kg}kg" if unit_kg > 1 else ""
        # ⚠️ 상품명을 확인 문장에도 반드시 포함 — LLM이 첫 문장을 요약해도 상품명이 남도록
        return (
            f"'{p['name']}' 한 가지를 찾았어요. (가격 {p['price']:,}원{unit_suffix}, 재고 {p['stock']}개) "
            f"'{p['name']}'으로 진행할까요? " +
            _action({
                "type": "PRODUCT_LIST",
                "products": [{
                    "id": p["id"],
                    "name": p["name"],
                    "price": p["price"],
                    "stock": p["stock"],
                    "unitKg": unit_kg,
                    "imageUrl": (p.get("imageUrls") or [None])[0],
                }],
            })
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

# 상품 상태 코드 → 한국어 레이블 (파일 전체에서 공통 사용)
_PRODUCT_STATUS_LABEL = {
    "ACTIVE": "판매중",
    "INACTIVE": "숨김",
    "SOLDOUT": "품절",
    "PENDING": "검수중",
    "REJECTED": "반려",
}


def _summarize_products(products: list[dict[str, Any]], max_items: int = 5) -> str:
    if not products:
        return "등록하신 상품이 아직 없어요."
    head = products[:max_items]
    lines = [
        f"- {p['name']} ({p['price']}원, 재고 {p['stock']}개, 상태 {_PRODUCT_STATUS_LABEL.get(p.get('status',''), p.get('status','-'))})"
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


@tool
async def get_my_product_status(product_name: str) -> str:
    """판매자 본인 상품의 현재 상태(판매중/검수중/숨김/품절 등), 가격, 재고, 판매량을 조회합니다.

    '배추 팔수있어?', '딸기 상태가 어때?', '딸기 가격이랑 재고 알려줘',
    '열라 맛있는 배추 지금 팔수있는건가?' 처럼 본인 등록 상품의 상태나 정보를 묻는 경우.

    ⚠️ 장터(공개 상품 목록)가 아닌 본인의 판매자 상품 목록에서 검색합니다.
       검수중(PENDING) 등 비공개 상태 상품도 조회 가능합니다.

    Args:
        product_name: 조회할 상품명 키워드 (예: "배추", "딸기", "열라 맛있는 토마토")
    """
    if (msg := _ensure_logged_in()):
        return msg

    product, err = await _find_seller_product(product_name, intent="product_status_check")
    if err:
        return err

    name = product.get("name", "?")
    price = product.get("price", 0)
    stock = product.get("stock", 0)
    sales_count = product.get("salesCount", 0)
    status = product.get("status", "")
    status_label = _PRODUCT_STATUS_LABEL.get(status, status)

    # 상태별 안내 메시지
    if status == "PENDING":
        status_msg = (
            f"'{name}' 상품은 현재 **검수중** 상태예요. "
            "관리자 검수가 완료되면 자동으로 판매가 시작돼요. 아직 구매자에게 노출되지 않습니다.\n"
            "가격·재고는 검수와 무관하게 지금도 수정 가능해요!"
        )
    elif status == "ACTIVE":
        status_msg = f"'{name}' 상품은 현재 **판매중** 상태예요. 구매자가 바로 구매할 수 있어요! ✅"
    elif status == "INACTIVE":
        status_msg = (
            f"'{name}' 상품은 현재 **숨김** 상태예요. "
            "'판매중으로 바꿔줘'라고 하시면 다시 노출할 수 있어요."
        )
    elif status == "SOLDOUT":
        status_msg = (
            f"'{name}' 상품은 현재 **품절** 상태예요. "
            "재고를 추가하면 판매를 재개할 수 있어요."
        )
    elif status == "REJECTED":
        status_msg = (
            f"'{name}' 상품은 **반려** 상태예요. "
            "상품 정보를 수정 후 다시 등록해 주세요."
        )
    else:
        status_msg = f"'{name}' 상품의 현재 상태는 '{status_label}'이에요."

    return (
        f"{status_msg}\n"
        f"• 가격: {price:,}원\n"
        f"• 재고: {stock}개\n"
        f"• 누적 판매량: {sales_count}개\n" +
        _action({"type": "NAVIGATE", "url": "/mypage/seller"})
    )


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


@tool
async def track_my_order(order_number: Optional[str] = None, keyword: Optional[str] = None) -> str:
    """주문의 배송 현황(현재 위치/이동 이력)을 조회합니다.

    사용자가 '주문 ORD-XXX 배송 어디까지 왔어?', '딸기 배송 조회해줘' 처럼
    배송 추적을 요청할 때 사용합니다.

    Args:
        order_number: (선택) 조회할 주문번호 (예: "ORD-20240519-001")
        keyword: (선택) 상품명으로 찾을 때 사용 (예: "딸기")
    """
    if (msg := _ensure_logged_in()):
        return msg

    try:
        data = await call_backend("GET", "/api/shop/order")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"주문 내역을 불러오지 못했어요. ({e.message})"

    orders: list[dict] = data.get("data") or []
    if not orders:
        return "조회할 주문이 없어요."

    # 대상 주문 선택
    target: Optional[dict] = None
    if order_number:
        target = next(
            (o for o in orders if o.get("orderNumber", "").lower() == order_number.lower()),
            None,
        )
        if not target:
            return f"주문번호 '{order_number}'에 해당하는 주문을 찾지 못했어요."
    elif keyword:
        for o in orders:
            for it in (o.get("items") or []):
                name = (it.get("product") or {}).get("name") or it.get("productName") or ""
                if keyword in name or name in keyword:
                    target = o
                    break
            if target:
                break
        if not target:
            return f"'{keyword}' 상품이 포함된 주문을 찾지 못했어요."
    else:
        # 조건 미지정 시: 배송중인 주문 자동 선택, 없으면 가장 최근 주문
        shippable = [o for o in orders if o.get("status") in ("SHIPPING", "ACCEPTED", "COMPLETED")]
        target = (shippable or orders)[0]

    tracking_number = target.get("trackingNumber")
    order_no = target.get("orderNumber", "")
    if not tracking_number:
        return (
            f"주문 '{order_no}'은(는) 아직 송장이 등록되지 않았어요. "
            "판매자가 발송 처리하면 배송 조회가 가능해요."
        )

    try:
        track_data = await call_backend(
            "GET",
            f"/api/shop/courier/track?trackingNumber={tracking_number}",
        )
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"배송 조회에 실패했어요. ({e.message})"

    history: list[dict] = track_data if isinstance(track_data, list) else (track_data.get("data") or [])
    if not history:
        return f"주문 '{order_no}' 배송 정보가 아직 없어요. 잠시 후 다시 시도해 주세요."

    current = next((h for h in history if h.get("current")), history[-1])
    lines = [
        f"- {h.get('time', '')} {h.get('location', '')} - {h.get('description', '')}"
        + (" ◀ 현재" if h.get("current") else "")
        for h in history[-5:]
    ]
    summary = "\n".join(lines)
    return (
        f"주문 '{order_no}' 배송 현황 (송장 {tracking_number})\n"
        f"현재: {current.get('location', '')} - {current.get('description', '')}\n"
        f"{summary}\n" +
        _action({"type": "NAVIGATE", "url": "/mypage/history"})
    )


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
            "unitKg": p.get("unitKg") or 1,
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
        unit_kg = product.get("unitKg") or 1
        qty = item.get("quantity", 1)
        subtotal = price * qty
        total_amount += subtotal
        unit_suffix = f" / {unit_kg}kg" if unit_kg > 1 else ""
        lines.append(f"- {name} {qty}개{unit_suffix} ({price:,}원 × {qty} = {subtotal:,}원)")
        image_urls = product.get("imageUrls") or []
        product_items.append({
            "id": item.get("productId"),
            "name": name,
            "price": price,
            "stock": product.get("stock"),
            "unitKg": unit_kg,
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


@tool
async def update_cart_qty(product_name: Optional[str] = None, quantity: Optional[int] = None) -> str:
    """장바구니에 담긴 특정 상품의 수량을 변경합니다.

    사용자가 '배추 장바구니 3개로 바꿔줘', '장바구니에서 사과 5개로 늘려줘' 처럼
    이미 장바구니에 있는 상품의 수량을 조정할 때 사용합니다.
    필수 인자가 누락되면 PendingIntent를 반환해 다중 턴으로 채울 수 있게 합니다.

    Args:
        product_name: 수량을 바꿀 상품명 키워드 (예: "배추")
        quantity: 변경할 수량 (1 이상)
    """
    if (msg := _ensure_logged_in()):
        return msg

    # ── 슬롯 부족 시 PendingIntent 발행 ──
    missing = []
    if not product_name: missing.append("product_name")
    if quantity is None: missing.append("quantity")
    if missing:
        filled = {}
        if product_name: filled["product_name"] = product_name
        if quantity is not None: filled["quantity"] = quantity
        prompts = {
            "product_name": "어떤 상품의 수량을 바꿔드릴까요? (예: '배', '사과')",
            "quantity": "몇 개로 바꿔드릴까요?",
        }
        return prompts[missing[0]] + " " + _pending({
            "tool": "update_cart_qty",
            "filled": filled,
            "missing": missing,
            "prompts": prompts,
            "domain": "shop",
        })

    if quantity < 1:
        return "수량은 1개 이상이어야 해요. 빼고 싶다면 '장바구니에서 빼줘'라고 말해주세요."

    try:
        data = await call_backend("GET", "/api/shop/cart")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"장바구니를 불러오지 못했어요. ({e.message})"

    cart_items: list[dict] = data if isinstance(data, list) else (data.get("data") or [])
    if not cart_items:
        return "장바구니가 비어 있어요. 먼저 상품을 담아주세요."

    matched = _match_cart_items(cart_items, [product_name])
    if not matched:
        names = ", ".join((it.get("product") or {}).get("name", "?") for it in cart_items[:5])
        return f"'{product_name}'을(를) 장바구니에서 찾지 못했어요. 현재 장바구니: {names}"

    target = matched[0]
    target_name = (target.get("product") or {}).get("name", product_name)
    cart_item_id = target.get("id")

    try:
        await call_backend(
            "PATCH",
            f"/api/shop/cart/{cart_item_id}",
            json_body={"quantity": quantity},
        )
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"수량 변경에 실패했어요. ({e.message})"

    return (
        f"'{target_name}' 장바구니 수량을 {quantity}개로 변경했어요. ✅ " +
        _action({"type": "TOAST", "level": "success", "message": f"{target_name} {quantity}개로 변경됨"}) +
        _action({"type": "REFRESH", "scope": "cart"})
    )


@tool
async def remove_from_cart(product_name: str) -> str:
    """장바구니에서 특정 상품을 삭제합니다.

    사용자가 '장바구니에서 배추 빼줘', '사과 장바구니에서 지워줘' 처럼
    장바구니의 항목을 제거할 때 사용합니다.

    Args:
        product_name: 삭제할 상품명 키워드 (예: "배추")
    """
    if (msg := _ensure_logged_in()):
        return msg

    try:
        data = await call_backend("GET", "/api/shop/cart")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"장바구니를 불러오지 못했어요. ({e.message})"

    cart_items: list[dict] = data if isinstance(data, list) else (data.get("data") or [])
    if not cart_items:
        return "장바구니가 비어 있어요."

    matched = _match_cart_items(cart_items, [product_name])
    if not matched:
        names = ", ".join((it.get("product") or {}).get("name", "?") for it in cart_items[:5])
        return f"'{product_name}'을(를) 장바구니에서 찾지 못했어요. 현재 장바구니: {names}"

    target = matched[0]
    target_name = (target.get("product") or {}).get("name", product_name)
    cart_item_id = target.get("id")

    try:
        await call_backend("DELETE", f"/api/shop/cart/{cart_item_id}")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"장바구니 삭제에 실패했어요. ({e.message})"

    return (
        f"'{target_name}'을(를) 장바구니에서 삭제했어요. 🗑️ " +
        _action({"type": "TOAST", "level": "success", "message": f"{target_name} 삭제됨"}) +
        _action({"type": "REFRESH", "scope": "cart"})
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
            _action({"type": "REFRESH", "scope": "orders"})
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
            _action({"type": "REFRESH", "scope": "orders"})
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
    unit_kg = p.get("unitKg") or 1
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

    unit_suffix = f" / {unit_kg}kg" if unit_kg > 1 else ""
    detail_lines = [
        f"📦 **{name}**",
        f"가격: {price:,}원{unit_suffix} | 판매 단위: 1개당 {unit_kg}kg | 재고: {stock}개 | 판매량: {sales_count}개",
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
        "unitKg": unit_kg,
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
        f"'{product_name}' 상품 정보를 자동으로 채워드렸어요. (추천 가격: {final_price:,}원){user_note} " +
        _action({"type": "NAVIGATE", "url": "/mypage/seller/register"}) +
        _action({"type": "FILL_FORM", "target": "seller_register", "payload": fill_payload})
    )


# ════════════════════════════════════════════════════════
# 판매자 상품 수정 / 삭제 / 상태 변경
# ════════════════════════════════════════════════════════
# _PRODUCT_STATUS_LABEL 은 섹션 5 상단에 정의됨 (파일 전체 공용)


# ── 한글 퍼지 매칭 헬퍼 ──────────────────────────────────

_CHOSUNG  = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
_JUNGSUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
_JONGSUNG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'


def _to_jamo(text: str) -> str:
    """한글 음절 → 초·중·종성 자모 시퀀스 (외부 라이브러리 불필요).

    '토마토' → 'ㅌㅗㅁㅏㅌㅗ'  /  '토매' → 'ㅌㅗㅁㅐ'
    자모 레벨 유사도 계산에 사용.
    """
    result: list[str] = []
    for ch in text:
        code = ord(ch)
        if 0xAC00 <= code <= 0xD7A3:
            offset = code - 0xAC00
            jong = offset % 28
            jung = (offset // 28) % 21
            cho  = offset // 28 // 21
            result.append(_CHOSUNG[cho])
            result.append(_JUNGSUNG[jung])
            if jong:
                jong_ch = _JONGSUNG[jong].strip()
                if jong_ch:
                    result.append(jong_ch)
        else:
            result.append(ch)
    return "".join(result)


def _jamo_similarity(kw: str, name: str) -> float:
    """키워드 ↔ 상품명 자모 레벨 유사도 (0~1).

    3가지 방법의 최대값을 반환:
      1. 키워드 자모 ↔ 상품명 각 단어 자모의 SequenceMatcher 비율
      2. 키워드 자모를 상품명 자모 전체에 슬라이딩 윈도우로 비교
    """
    from difflib import SequenceMatcher

    kw_jamo  = _to_jamo(kw.lower().replace(" ", ""))
    if not kw_jamo:
        return 0.0

    best = 0.0

    # 방법 1: 키워드 ↔ 각 단어 비교
    for word in name.lower().split():
        word_jamo = _to_jamo(word)
        if not word_jamo:
            continue
        r = SequenceMatcher(None, kw_jamo, word_jamo).ratio()
        if r > best:
            best = r

    # 방법 2: 슬라이딩 윈도우 (키워드가 상품명 일부와 매칭되는 경우)
    full_jamo = _to_jamo(name.lower().replace(" ", ""))
    kw_len = len(kw_jamo)
    full_len = len(full_jamo)
    if kw_len > 0 and full_len >= kw_len:
        for start in range(full_len - kw_len + 1):
            window = full_jamo[start : start + kw_len]
            r = SequenceMatcher(None, kw_jamo, window).ratio()
            if r > best:
                best = r

    return best


def _match_products_fuzzy(
    products: list[dict],
    name_keyword: str,
    fuzzy_threshold: float = 0.55,
) -> list[tuple[dict, float]]:
    """3단계 매칭으로 판매 상품에서 키워드와 유사한 상품 목록 반환.

    Returns: [(product, score), ...] sorted by score desc
      - Level 1: 정확한 부분 문자열 포함 (score=1.0)
      - Level 2: 키워드 단어 중 하나가 상품명에 포함 (score=0.9)
      - Level 3: 자모 유사도 >= fuzzy_threshold (score=similarity)
    """
    kw = name_keyword.strip().lower()
    kw_words = [w for w in kw.split() if len(w) >= 2]
    results: list[tuple[dict, float]] = []

    for p in products:
        pname = p.get("name", "").lower()

        # L1: exact substring
        if kw in pname:
            results.append((p, 1.0))
            continue

        # L2: any keyword word in product name
        if kw_words and any(w in pname for w in kw_words):
            results.append((p, 0.9))
            continue

        # L3: jamo similarity
        sim = _jamo_similarity(kw, pname)
        if sim >= fuzzy_threshold:
            results.append((p, sim))

    results.sort(key=lambda x: x[1], reverse=True)
    return results


async def _find_seller_product(
    name_keyword: str,
    intent: str = "select",
) -> tuple[dict | None, str | None]:
    """판매자 상품 목록에서 이름 키워드로 상품 1건을 찾습니다.

    3단계 퍼지 매칭 적용:
      L1 정확한 부분 문자열 → L2 단어 단위 → L3 자모 유사도

    매칭 실패 시 CLARIFY 액션으로 전체 목록 제시.

    Args:
        name_keyword: 검색 키워드 (예: "토마토", "상추")
        intent: CLARIFY에 포함될 의도 식별자 (예: "product_delete", "product_update")

    Returns:
        (product_dict, error_message) — 성공 시 (dict, None), 실패 시 (None, str)
    """
    try:
        data = await call_backend("GET", "/api/shop/seller")
    except BackendError as e:
        if e.status_code == 401:
            return None, _login_required_message()
        return None, f"상품 목록 조회에 실패했어요. ({e.message})"

    products: list[dict] = data.get("data") or []
    if not products:
        return None, "등록된 상품이 없어요."

    matched_with_score = _match_products_fuzzy(products, name_keyword)

    if not matched_with_score:
        # 전체 상품을 CLARIFY 선택지로 제시
        options = [
            {"id": p.get("name", ""), "label": p.get("name", "")}
            for p in products[:8]
        ]
        clarify_msg = (
            f"'{name_keyword}' 상품을 찾지 못했어요. "
            "아래 목록에서 원하시는 상품을 선택해 주세요. " +
            _action({
                "type": "CLARIFY",
                "intent": intent,
                "question": "어떤 상품인지 선택해 주세요:",
                "options": options,
            })
        )
        return None, clarify_msg

    matched = [p for p, _ in matched_with_score]

    if len(matched) > 1:
        # 유사 상품 여러 개 → CLARIFY로 선택
        options = [{"id": p.get("name", ""), "label": p.get("name", "")} for p in matched[:5]]
        score_info = matched_with_score[0][1]
        clarify_msg = (
            f"'{name_keyword}'과(와) 비슷한 상품이 여러 개예요. " +
            _action({
                "type": "CLARIFY",
                "intent": intent,
                "question": "어떤 상품인지 선택해 주세요:",
                "options": options,
            })
        )
        return None, clarify_msg

    # 1건 매칭
    best, score = matched_with_score[0]
    if score < 1.0:
        logger.info(
            "[ShopTool] 퍼지 매칭: '%s' → '%s' (score=%.2f)",
            name_keyword, best.get("name"), score,
        )
    return best, None


@tool
async def update_product(
    product_name: str,
    price: Optional[int] = None,
    stock: Optional[int] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
) -> str:
    """판매자가 본인 상품 정보를 수정할 때 사용합니다.

    변경할 필드만 전달하면 나머지는 기존 값을 유지합니다.

    Args:
        product_name: 수정할 상품명 키워드 (예: "상추", "유기농 토마토")
        price: 변경할 가격 (원). 미지정 시 기존 값 유지.
        stock: 변경할 재고 수량. 미지정 시 기존 값 유지.
        description: 변경할 상품 설명. 미지정 시 기존 값 유지.
        category: 변경할 카테고리명. 미지정 시 기존 값 유지.
    """
    if (msg := _ensure_logged_in()):
        return msg

    # 가격·재고만 변경하려는 경우: 판매자 상품에 없는데 장바구니에 있으면 모호성 해소
    only_inventory_intent = (price is not None or stock is not None) and description is None and category is None
    if only_inventory_intent:
        try:
            cart_data = await call_backend("GET", "/api/shop/cart")
            cart_items = cart_data if isinstance(cart_data, list) else (cart_data.get("data") or [])
        except BackendError:
            cart_items = []
        cart_match = next(
            (it for it in cart_items
             if product_name in ((it.get("product") or {}).get("name", "") or "")
             or ((it.get("product") or {}).get("name", "") or "") in product_name),
            None,
        )
        try:
            seller_data = await call_backend("GET", "/api/shop/seller")
            seller_products = seller_data.get("data") or []
        except BackendError:
            seller_products = []
        seller_match = next(
            (p for p in seller_products
             if product_name in (p.get("name", "") or "")
             or (p.get("name", "") or "") in product_name),
            None,
        )
        # 본인 등록 상품엔 없는데 장바구니에만 있으면 → 장바구니 수량 변경 안내
        if not seller_match and cart_match and stock is not None:
            cart_name = (cart_match.get("product") or {}).get("name", product_name)
            return (
                f"'{product_name}'은(는) 본인이 등록한 판매 상품이 아니에요. "
                f"혹시 장바구니에 담긴 '{cart_name}' 수량을 {stock}개로 바꾸시려는 건가요?\n"
                f"맞다면 '장바구니에서 {cart_name} {stock}개로 바꿔줘'라고 다시 말씀해 주세요."
            )

    product, err = await _find_seller_product(product_name, intent="product_update")
    if err:
        return err

    product_id = product["id"]
    product_status = product.get("status", "")
    product_name_full = product.get("name", product_name)
    is_pending = product_status == "PENDING"

    # 변경 필드가 없으면 수정 페이지로 이동
    if all(v is None for v in [price, stock, description, category]):
        return (
            f"'{product_name_full}' 상품 수정 페이지로 이동합니다. "
            "원하시는 항목을 직접 수정해 주세요. " +
            _action({"type": "NAVIGATE", "url": f"/mypage/seller/{product_id}/edit"})
        )

    # ── 검수중 상품에 콘텐츠 변경 시도 → 안내 후 차단 ──
    has_content_change = description is not None or category is not None
    if is_pending and has_content_change:
        if price is not None or stock is not None:
            # 가격·재고는 같이 처리해주되, 콘텐츠 변경 불가 안내
            notice = (
                f"'{product_name_full}' 상품은 검수중이라 이름·설명·카테고리는 수정할 수 없어요. "
                "가격·재고는 반영할게요. 설명/카테고리는 검수 완료 후 다시 시도해 주세요.\n"
            )
        else:
            return (
                f"'{product_name_full}' 상품은 현재 검수중이에요. "
                "이름·설명·카테고리·이미지는 검수 완료 후에만 수정할 수 있어요. "
                "가격·재고는 지금도 수정 가능해요! (예: '{product_name_full} 재고 20개로 바꿔줘')"
            )
    else:
        notice = ""

    # ── 유효성 검사 ──
    if price is not None and price <= 0:
        return f"가격은 1원 이상이어야 해요. (입력값: {price}원)\n예) '{product_name_full} 가격 5000원으로 바꿔줘'"
    if stock is not None and stock < 0:
        return f"재고는 0개 이상이어야 해요. (입력값: {stock}개)\n예) '{product_name_full} 재고 0개로 바꿔줘'"

    # ── 가격·재고만 변경: /inventory 엔드포인트 (검수중 포함 모든 상태 허용) ──
    only_inventory = (price is not None or stock is not None) and not has_content_change
    if is_pending or only_inventory:
        inventory_body: dict = {}
        if price is not None: inventory_body["price"] = price
        if stock is not None: inventory_body["stock"] = stock
        if not inventory_body:
            return f"수정할 가격 또는 재고 값을 알려주세요."
        try:
            await call_backend("PATCH", f"/api/shop/seller/{product_id}/inventory", json_body=inventory_body)
        except BackendError as e:
            if e.status_code == 403:
                return "본인 상품만 수정할 수 있어요."
            return f"상품 수정에 실패했어요. ({e.message})"

        changed = []
        if price is not None: changed.append(f"가격 {price:,}원")
        if stock is not None: changed.append(f"재고 {stock}개")

        return (
            notice +
            f"'{product_name_full}' 상품의 {', '.join(changed)}을(를) 수정했어요. ✅"
            + (" 검수는 계속 진행 중이에요." if is_pending else "") + " " +
            _action({"type": "TOAST", "level": "success", "message": "상품이 수정되었습니다."}) +
            _action({"type": "REFRESH", "scope": "seller_products"})
        )

    # ── 콘텐츠 포함 전체 수정: 기존 상세 조회 후 PATCH (ACTIVE 상태 → PENDING 재검수) ──
    try:
        detail_data = await call_backend("GET", f"/api/shop/product/{product_id}")
    except BackendError as e:
        return f"상품 정보 조회에 실패했어요. ({e.message})"
    detail = detail_data.get("data") or {}

    new_price = price if price is not None else detail.get("price", 0)
    new_stock = stock if stock is not None else detail.get("stock", 0)
    new_desc = description if description is not None else detail.get("description", "")
    new_cat = category if category is not None else detail.get("categoryName", "")
    new_name = detail.get("name", product_name_full)
    image_urls = detail.get("imageUrls") or []

    try:
        await call_backend("PATCH", f"/api/shop/seller/{product_id}", json_body={
            "name": new_name,
            "price": new_price,
            "stock": new_stock,
            "description": new_desc,
            "categoryName": new_cat,
            "imageUrls": image_urls,
        })
    except BackendError as e:
        if e.status_code == 403:
            return "본인 상품만 수정할 수 있어요."
        return f"상품 수정에 실패했어요. ({e.message})"

    changed = []
    if price is not None: changed.append(f"가격 {price:,}원")
    if stock is not None: changed.append(f"재고 {stock}개")
    if description is not None: changed.append("설명")
    if category is not None: changed.append(f"카테고리 {category}")

    return (
        f"'{new_name}' 상품의 {', '.join(changed)}을(를) 수정했어요. "
        "내용 변경으로 재검수가 시작됩니다. 검수 완료 후 자동으로 다시 판매돼요. " +
        _action({"type": "TOAST", "level": "success", "message": "상품이 수정되었습니다."}) +
        _action({"type": "REFRESH", "scope": "seller_products"})
    )


@tool
async def delete_product(product_name: str) -> str:
    """판매자가 본인 상품을 삭제(판매 중단)할 때 사용합니다.

    Args:
        product_name: 삭제할 상품명 키워드 (예: "상추", "토마토")
    """
    if (msg := _ensure_logged_in()):
        return msg

    product, err = await _find_seller_product(product_name, intent="product_delete")
    if err:
        return err

    product_id = product["id"]
    try:
        await call_backend("DELETE", f"/api/shop/seller/{product_id}")
    except BackendError as e:
        if e.status_code == 403:
            return "본인 상품만 삭제할 수 있어요."
        return f"상품 삭제에 실패했어요. ({e.message})"

    return (
        f"'{product['name']}' 상품이 삭제되었어요. " +
        _action({"type": "TOAST", "level": "success", "message": "상품이 삭제되었습니다."}) +
        _action({"type": "REFRESH", "scope": "seller_products"})
    )


@tool
async def change_product_status(product_name: str, status: str) -> str:
    """판매자가 상품 상태를 변경(판매중/숨김/품절)할 때 사용합니다.

    Args:
        product_name: 대상 상품명 키워드 (예: "상추")
        status: 변경할 상태. 반드시 다음 중 하나: ACTIVE(판매중), INACTIVE(숨김), SOLDOUT(품절)
    """
    if (msg := _ensure_logged_in()):
        return msg

    status_upper = status.strip().upper()
    STATUS_ALIAS = {
        "판매중": "ACTIVE", "판매": "ACTIVE",
        "숨김": "INACTIVE", "비활성": "INACTIVE", "숨기기": "INACTIVE",
        "품절": "SOLDOUT",
    }
    status_upper = STATUS_ALIAS.get(status_upper, STATUS_ALIAS.get(status.strip(), status_upper))

    if status_upper not in ("ACTIVE", "INACTIVE", "SOLDOUT"):
        return (
            f"'{status}'은(는) 유효하지 않은 상태예요. "
            "ACTIVE(판매중), INACTIVE(숨김), SOLDOUT(품절) 중 하나를 지정해 주세요."
        )

    product, err = await _find_seller_product(product_name, intent="product_status")
    if err:
        return err

    product_id = product["id"]
    current = product.get("status", "")
    if current in ("PENDING", "REJECTED"):
        return (
            f"'{product['name']}' 상품은 현재 '{_PRODUCT_STATUS_LABEL.get(current, current)}' 상태라 "
            "상태를 직접 변경할 수 없어요. 검수가 완료된 후 변경해 주세요."
        )

    try:
        await call_backend("PATCH", f"/api/shop/seller/{product_id}/status", json_body={"status": status_upper})
    except BackendError as e:
        if e.status_code == 403:
            return "본인 상품만 상태를 변경할 수 있어요."
        return f"상태 변경에 실패했어요. ({e.message})"

    label = _PRODUCT_STATUS_LABEL.get(status_upper, status_upper)
    return (
        f"'{product['name']}' 상품을 '{label}' 상태로 변경했어요. " +
        _action({"type": "TOAST", "level": "success", "message": f"상품 상태가 '{label}'으로 변경되었습니다."}) +
        _action({"type": "REFRESH", "scope": "seller_products"})
    )


# ════════════════════════════════════════════════════════
# 판매자 주문 상태 변경
# ════════════════════════════════════════════════════════

_SELLER_ORDER_STATUS_LABEL = {
    "ORDERED": "결제완료(접수대기)",
    "ACCEPTED": "접수완료(배송준비중)",
    "SHIPPED": "배송중",
    "COMPLETED": "배송완료",
    "CANCELLED": "취소",
}


@tool
async def update_seller_order_status(
    order_number: Optional[str] = None,
    action: str = "advance",
) -> str:
    """판매자가 주문 상태를 변경할 때 사용합니다.

    동작:
        - action="advance": ORDERED → ACCEPTED (접수확인) 또는 ACCEPTED → SHIPPED (발송)
        - action="cancel" : ORDERED 주문 거절/취소

    Args:
        order_number: 처리할 주문번호 (예: "ORD-20240519-001"). 미지정 시 최신 대기 주문 1건 자동 선택.
        action: "advance"(기본, 다음 단계 진행) 또는 "cancel"(주문 거절)
    """
    if (msg := _ensure_logged_in()):
        return msg

    action = action.strip().lower()
    action_alias = {
        "접수": "advance", "접수확인": "advance", "발송": "ship", "배송": "ship",
        "거절": "cancel", "취소": "cancel", "반려": "cancel",
    }
    action = action_alias.get(action, action)
    if action not in ("advance", "ship", "cancel"):
        return f"'{action}'은 유효하지 않아요. advance(접수/발송), cancel(거절) 중 하나를 사용하세요."

    # 판매자 주문 목록 조회
    try:
        data = await call_backend("GET", "/api/shop/seller/order")
    except BackendError as e:
        if e.status_code == 401:
            return _login_required_message()
        return f"주문 목록 조회에 실패했어요. ({e.message})"

    orders: list[dict] = data.get("data") or []
    if not orders:
        return "처리할 주문이 없어요."

    # 대상 주문 선택
    if order_number:
        target = next(
            (o for o in orders if o.get("orderNumber", "").lower() == order_number.lower()),
            None,
        )
        if not target:
            return f"'{order_number}' 주문을 찾지 못했어요. 주문번호를 다시 확인해 주세요."
    else:
        # 미지정: action에 맞는 대기 주문 자동 선택
        if action == "cancel":
            candidates = [o for o in orders if o.get("status") == "ORDERED"]
        elif action == "ship":
            candidates = [o for o in orders if o.get("status") == "ACCEPTED"]
        else:  # advance
            candidates = [o for o in orders if o.get("status") in ("ORDERED", "ACCEPTED")]

        if not candidates:
            action_label = {"advance": "처리 가능한", "ship": "발송 가능한(접수완료)", "cancel": "거절 가능한(접수대기)"}
            return f"현재 {action_label.get(action, '')} 주문이 없어요."

        if len(candidates) > 1:
            opts = [
                {"id": o.get("orderNumber"), "label": f"{o.get('orderNumber')} — " + ", ".join(
                    i.get("productName", "") for i in (o.get("items") or [])[:2]
                ) + f" ({o.get('totalAmount', 0):,}원)"}
                for o in candidates[:5]
            ]
            return _action({"type": "CLARIFY", "intent": f"seller_order_{action}", "question": "어떤 주문을 처리할까요?", "options": opts})

        target = candidates[0]

    # 현재 상태 검증
    current_status = target.get("status", "")
    target_num = target.get("orderNumber", "-")
    item_summary = ", ".join(i.get("productName", "") for i in (target.get("items") or [])[:2])

    if action == "cancel" and current_status != "ORDERED":
        return f"'{target_num}' 주문은 '{_SELLER_ORDER_STATUS_LABEL.get(current_status, current_status)}' 상태라 거절할 수 없어요."
    if action == "ship" and current_status != "ACCEPTED":
        return f"'{target_num}' 주문은 먼저 접수 확인을 해야 발송 처리할 수 있어요."
    if action == "advance" and current_status not in ("ORDERED", "ACCEPTED"):
        return f"'{target_num}' 주문은 '{_SELLER_ORDER_STATUS_LABEL.get(current_status, current_status)}' 상태라 진행할 수 없어요."

    # 실제 action 결정 (advance는 현재 상태에 따라 내부 action 결정)
    api_action = action
    if action == "advance":
        api_action = "ship" if current_status == "ACCEPTED" else "advance"

    # API 호출
    try:
        await call_backend("PATCH", f"/api/shop/seller/order/{target['id']}", json_body={"action": api_action})
    except BackendError as e:
        return f"주문 상태 변경에 실패했어요. ({e.message})"

    # 응답 메시지
    action_msgs = {
        ("advance", "ORDERED"): ("접수 확인", "접수 처리되었습니다."),
        ("ship", "ACCEPTED"): ("발송 완료", "발송 처리되었습니다."),
        ("cancel", "ORDERED"): ("주문 거절", "주문이 거절되었습니다."),
    }
    action_key = (action, current_status)
    label, toast_msg = action_msgs.get(action_key, ("처리", "처리되었습니다."))

    return (
        f"'{target_num}' 주문({item_summary})이 {label} 처리되었어요. " +
        _action({"type": "TOAST", "level": "success", "message": toast_msg}) +
        _action({"type": "REFRESH", "scope": "seller_orders"})
    )
