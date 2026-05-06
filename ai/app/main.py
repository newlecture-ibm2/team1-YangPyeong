"""
FarmBalance AI 서버 엔트리포인트.
"""
import logging

from fastapi import FastAPI
from app.routers import analysis, health
from app.routers import policy as policy_router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="FarmBalance AI Server",
    description="정책/혜택 분석, 챗봇 Agent, 맞춤 추천 API",
    version="0.2.0",
)

# ── 라우터 등록 ──
app.include_router(health.router)
app.include_router(policy_router.router)
app.include_router(analysis.router)

# TODO: STEP 10에서 chat/agent 라우터 등록
