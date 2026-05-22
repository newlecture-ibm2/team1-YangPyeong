"""
FarmBalance AI 서버 엔트리포인트.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health
from app.routers import policy as policy_router
from app.routers import chat as chat_router
from app.routers import product_assist as product_assist_router
from app.routers import recommend as recommend_router
from app.routers import gov as gov_router
from app.routers import analysis as analysis_router
from app.routers import revenue as revenue_router
from app.routers import farm_agent as farm_agent_router
from app.routers import balance_agent as balance_agent_router
from app.routers import general_agent as general_agent_router
from app.routers import community_agent as community_agent_router
from app.routers import ocr as ocr_router
from app.routers import admin as admin_router
from app.routers import parse as parse_router
from app.routers import stt as stt_router

# ── STT 도메인 등록 ──
from app.services.domain_registry import register, DomainSpec, LLMConfig
from app.models.farm_history import FarmHistoryParseResponse, sanitize_farm_history
from app.prompts.farm_history import SYSTEM_PROMPT as FARM_HISTORY_PROMPT

register("farm_history", DomainSpec(
    schema=FarmHistoryParseResponse,
    prompt=FARM_HISTORY_PROMPT,
    sanitizer=sanitize_farm_history,
    llm_config=LLMConfig(temperature=0.2, max_output_tokens=1024),
))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FarmBalance AI Server",
    description="정책/혜택 분석, 챗봇 Agent, 맞춤 추천, 상품 AI 어시스트, OCR API",
    version="0.3.0",
)

# ── CORS 설정 ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 라우터 등록 ──
app.include_router(health.router)
app.include_router(policy_router.router)
app.include_router(chat_router.router)
app.include_router(analysis_router.router)
app.include_router(product_assist_router.router)
app.include_router(recommend_router.router)
app.include_router(admin_router.router)
app.include_router(gov_router.router)
app.include_router(revenue_router.router)
app.include_router(farm_agent_router.router)
app.include_router(balance_agent_router.router)
app.include_router(ocr_router.router)
app.include_router(general_agent_router.router)
app.include_router(community_agent_router.router)
app.include_router(parse_router.router)
app.include_router(stt_router.router)

logger.info("FarmBalance AI Server has started successfully.")
