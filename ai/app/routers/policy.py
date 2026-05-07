"""
정책 분석 API 라우터.
POST /api/policy/analyze
"""
import logging

from fastapi import APIRouter, HTTPException

from app.models.policy import PolicyAnalyzeRequest, PolicyAnalyzeResponse
from app.services.policy_analyzer import analyze_policy

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/policy", tags=["policy"])


@router.post("/analyze", response_model=PolicyAnalyzeResponse)
async def analyze(request: PolicyAnalyzeRequest) -> PolicyAnalyzeResponse:
    """
    정책 데이터를 AI로 분석하여 정규화된 JSON을 반환합니다.

    - raw (JSON) 또는 text (텍스트) 중 하나 이상 필수
    - 분석 결과에 confidence(신뢰도)와 warnings(경고) 포함
    """
    if not request.raw and not request.text:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "E-AI-POL-001",
                "message": "raw 또는 text 중 하나 이상 필수입니다.",
            },
        )

    try:
        result = await analyze_policy(
            source=request.source,
            external_id=request.external_id,
            raw=request.raw,
            text=request.text,
            source_url=request.source_url,
        )
        return PolicyAnalyzeResponse(
            status="ok",
            source=request.source,
            external_id=request.external_id,
            result=result,
        )
    except ValueError as e:
        logger.error(f"[policy/analyze] 분석 실패: {request.external_id} — {e}")
        return PolicyAnalyzeResponse(
            status="error",
            source=request.source,
            external_id=request.external_id,
            error=str(e),
        )
    except Exception as e:
        logger.error(f"[policy/analyze] 예외 발생: {request.external_id} — {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "E-AI-POL-002",
                "message": f"정책 분석 중 오류가 발생했습니다: {str(e)}",
            },
        )
