"""Account Tools — 로그인·이메일·프로필·내 활동·주문 요약."""
from __future__ import annotations

import logging
import re
from typing import Any

from langchain_core.tools import tool

from app.agents.navigation_urls import (
    PAGE_LABELS,
    PAGE_PATHS,
    login_with_callback,
)
from app.agents.shared import action_token, ensure_logged_in
from app.utils.backend_client import BackendError, call_backend

logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _navigate(page_key: str, *, prefix: str = "") -> str:
    url = PAGE_PATHS[page_key]
    label = PAGE_LABELS[page_key]
    lead = f"{prefix} " if prefix else ""
    return f"{lead}{label}(으)로 이동할게요. " + action_token({"type": "NAVIGATE", "url": url})


def _extract_email(text: str) -> str | None:
    match = re.search(r"[\w.+-]+@[\w.-]+\.\w+", text)
    return match.group(0) if match else None


@tool
async def check_email_membership(email: str) -> str:
    """이메일 가입 여부를 확인합니다. '가입되어 있어?', '이 이메일 쓸 수 있어?' 질문 시 호출하세요.
    로그인 없이 호출 가능합니다."""
    addr = (email or "").strip()
    if not addr or not _EMAIL_RE.match(addr):
        inferred = _extract_email(email)
        if not inferred:
            return "확인할 이메일 주소를 알려주세요. 예: user@example.com"
        addr = inferred

    try:
        data = await call_backend("GET", "/api/users/check-email", params={"email": addr})
    except BackendError as e:
        return f"[이메일 확인 실패] 잠시 후 다시 시도해 주세요. ({e.message})"

    status = (data.get("data") or {}).get("status") or "unknown"
    if status == "available":
        return f"[이메일 확인] {addr} 은(는) 사용 가능한 이메일이에요. 회원가입을 진행하실 수 있어요."
    if status == "withdrawn":
        return (
            f"[이메일 확인] {addr} 은(는) 이전에 탈퇴한 계정이에요. "
            "같은 이메일로 재가입·복구 안내를 확인해 주세요. "
            + _navigate("signup", prefix="")
        )
    if status == "exists":
        return (
            f"[이메일 확인] {addr} 은(는) 이미 가입된 이메일이에요. "
            + _navigate("login", prefix="")
        )
    return f"[이메일 확인] 상태를 확인하지 못했어요. ({status})"


@tool
async def prompt_login(return_path: str = "/farm") -> str:
    """로그인이 필요할 때 로그인 화면으로 안내합니다. '로그인하고 싶어' 요청 시 호출하세요."""
    path = return_path if return_path.startswith("/") else f"/{return_path}"
    return (
        "로그인하시면 맞춤 안내를 받으실 수 있어요. "
        + action_token({"type": "NAVIGATE", "url": login_with_callback(path)})
    )


@tool
async def navigate_account_page(page: str) -> str:
    """계정·마이페이지 관련 화면으로 이동합니다.

    Args:
        page: login | signup | password_reset | mypage | mypage_posts | mypage_comments |
              mypage_reports | mypage_history | mypage_farm_applications
    """
    key = page.strip().lower()
    if key == "login":
        return await prompt_login.ainvoke({"return_path": "/farm"})
    public_pages = {"signup", "password_reset"}
    if key not in PAGE_PATHS:
        return f"'{page}' 화면을 찾지 못했어요."
    if key not in public_pages and (msg := ensure_logged_in()):
        return msg
    return _navigate(key, prefix="[계정 안내]")


@tool
async def get_profile_summary() -> str:
    """로그인한 사용자의 프로필 요약을 보여줍니다. '내 프로필', '전화번호 넣었어?' 질문 시 호출하세요."""
    if (msg := ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", "/api/users/me")
    except BackendError as e:
        if e.status_code == 401:
            return ensure_logged_in() or "로그인이 필요해요."
        return f"[프로필 조회 실패] {e.message}"

    profile = data.get("data") or {}
    name = profile.get("name") or "(이름 없음)"
    email = profile.get("email") or "-"
    phone = profile.get("phone") or "미등록"
    has_image = "있음" if profile.get("profileImageUrl") else "없음"
    lines = [
        f"[프로필 요약] 이름: {name}",
        f"- 이메일: {email}",
        f"- 전화번호: {phone}",
        f"- 프로필 사진: {has_image}",
    ]
    return "\n".join(lines) + " " + action_token({"type": "NAVIGATE", "url": PAGE_PATHS["mypage"]})


def _summarize_orders(orders: list[dict[str, Any]], max_items: int = 3) -> str:
    if not orders:
        return "최근 주문 내역이 없어요."
    lines = []
    for o in orders[:max_items]:
        oid = o.get("orderId") or o.get("id") or "-"
        status = o.get("status") or o.get("orderStatus") or "-"
        lines.append(f"- 주문 #{oid} ({status})")
    extra = f" 외 {len(orders) - max_items}건" if len(orders) > max_items else ""
    return f"최근 주문 {len(orders)}건 중{extra}:\n" + "\n".join(lines)


@tool
async def get_my_orders_summary() -> str:
    """구매 주문 내역을 요약합니다. '내 주문', '구매 내역', '배송' 질문 시 호출 (장터 판매 주문은 shop_agent)."""
    if (msg := ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", "/api/shop/order")
    except BackendError as e:
        if e.status_code == 401:
            return ensure_logged_in() or "로그인이 필요해요."
        return f"[주문 조회 실패] {e.message}"

    orders = data.get("data") or []
    if isinstance(orders, dict):
        orders = orders.get("content") or orders.get("items") or []
    summary = _summarize_orders(orders if isinstance(orders, list) else [])
    return (
        f"[주문 요약] {summary} "
        + action_token({"type": "NAVIGATE", "url": PAGE_PATHS["mypage_history"]})
    )


@tool
async def get_my_community_summary() -> str:
    """내 게시글·댓글·신고 건수를 요약합니다. '내가 쓴 글', '내 댓글' 질문 시 호출하세요."""
    if (msg := ensure_logged_in()):
        return msg

    posts_n, comments_n, reports_n = 0, 0, 0
    try:
        posts = await call_backend("GET", "/api/community/me/posts", params={"page": 0, "size": 1})
        meta = posts.get("meta") or {}
        posts_n = int(meta.get("total") or len(posts.get("data") or []))
    except BackendError:
        pass
    try:
        comments = await call_backend("GET", "/api/community/me/comments", params={"page": 0, "size": 1})
        meta = comments.get("meta") or {}
        comments_n = int(meta.get("total") or len(comments.get("data") or []))
    except BackendError:
        pass
    try:
        reports = await call_backend("GET", "/api/community/me/reports", params={"page": 0, "size": 1})
        meta = reports.get("meta") or {}
        reports_n = int(meta.get("total") or len(reports.get("data") or []))
    except BackendError:
        pass

    return (
        f"[내 활동 요약] 게시글 {posts_n}건, 댓글 {comments_n}건, 신고 {reports_n}건이에요. "
        "자세한 목록은 마이페이지에서 볼 수 있어요. "
        + action_token({"type": "NAVIGATE", "url": PAGE_PATHS["mypage_posts"]})
    )
