"""챗봇 NAVIGATE URL 단일 진실 공급원 (farmBotScenarios.ts 경로와 동일)."""
from __future__ import annotations

from urllib.parse import quote

# ── 인증 ──
SIGNUP = "/signup"
PASSWORD_RESET = "/password-reset"


def login_with_callback(return_path: str = "/farm/recommend") -> str:
    return f"/login?callbackUrl={quote(return_path, safe='')}"


# ── 농장 · 추천 · 수익 ──
FARM_REGISTER = "/farm/register"
FARM_DASHBOARD = "/farm"
FARM_RECOMMEND = "/farm/recommend"
BALANCE = "/balance"
POLICY_RECOMMEND = "/policy/recommend"
COMMUNITY = "/community"

# ── 마이페이지 ──
MYPAGE = "/mypage"
MYPAGE_POSTS = "/mypage/posts"
MYPAGE_COMMENTS = "/mypage/comments"
MYPAGE_REPORTS = "/mypage/reports"
MYPAGE_HISTORY = "/mypage/history"
MYPAGE_SELLER = "/mypage/seller"
MYPAGE_SELLER_ORDERS = "/mypage/seller/orders"
MYPAGE_SELLER_REGISTER = "/mypage/seller/register"
MYPAGE_FARM_APPLICATIONS = "/mypage/farm-applications"

# 페이지 키 → 경로 (도구 인자용)
PAGE_PATHS: dict[str, str] = {
    "login": login_with_callback(),
    "signup": SIGNUP,
    "password_reset": PASSWORD_RESET,
    "farm_register": FARM_REGISTER,
    "farm": FARM_DASHBOARD,
    "farm_recommend": FARM_RECOMMEND,
    "balance": BALANCE,
    "policy_recommend": POLICY_RECOMMEND,
    "community": COMMUNITY,
    "mypage": MYPAGE,
    "mypage_posts": MYPAGE_POSTS,
    "mypage_comments": MYPAGE_COMMENTS,
    "mypage_reports": MYPAGE_REPORTS,
    "mypage_history": MYPAGE_HISTORY,
    "mypage_seller": MYPAGE_SELLER,
    "mypage_seller_orders": MYPAGE_SELLER_ORDERS,
    "mypage_farm_applications": MYPAGE_FARM_APPLICATIONS,
}

PAGE_LABELS: dict[str, str] = {
    "login": "로그인 화면",
    "signup": "회원가입 화면",
    "password_reset": "비밀번호 찾기 화면",
    "farm_register": "농장·재배 작물 등록 화면",
    "farm": "내 농장 대시보드",
    "farm_recommend": "AI 작물 추천 화면",
    "balance": "수급·시세 분석 화면",
    "policy_recommend": "맞춤 정책 추천 화면",
    "community": "커뮤니티",
    "mypage": "마이페이지 프로필",
    "mypage_posts": "내 게시글 목록",
    "mypage_comments": "내 댓글 목록",
    "mypage_reports": "신고 내역",
    "mypage_history": "구매 주문 내역",
    "mypage_seller": "판매자 센터",
    "mypage_seller_orders": "판매 주문 관리",
    "mypage_farm_applications": "농장 등록·승인 현황",
}
