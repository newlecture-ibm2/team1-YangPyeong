"""
FarmBalance AI 서버 엔트리포인트.
"""
import logging

from fastapi import FastAPI
from app.routers import analysis, health
from app.routers import policy as policy_router
from app.routers import chat as chat_router
from app.routers import product_assist as product_assist_router
from app.routers import recommend as recommend_router
from app.routers import gov as gov_router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="FarmBalance AI Server",
    description="정책/혜택 분석, 챗봇 Agent, 맞춤 추천, 상품 AI 어시스트 API",
    version="0.3.0",
)

# ── 라우터 등록 ──
app.include_router(health.router)
app.include_router(policy_router.router)
app.include_router(chat_router.router)
app.include_router(analysis.router)
app.include_router(product_assist_router.router)
app.include_router(recommend_router.router)
app.include_router(gov_router.router)

# TODO: STEP 10에서 chat/agent 라우터 등록
