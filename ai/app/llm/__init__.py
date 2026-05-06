"""
LLM Provider 팩토리
Provider를 지정하거나 환경변수 기본값으로 LLM 인스턴스를 반환합니다.

사용법:
    from app.llm import get_llm

    # 기본 Provider (환경변수 LLM_PROVIDER)
    llm = get_llm()

    # Provider 직접 지정
    gemini = get_llm("gemini")   # 분석/추천용
    groq = get_llm("groq")       # 챗봇용
"""

import logging
from typing import Optional

from app.config import settings
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)

# 싱글톤 캐시 (Provider별)
_instances: dict[str, BaseLLM] = {}


def get_llm(provider: Optional[str] = None) -> BaseLLM:
    """
    LLM 인스턴스를 반환합니다.

    Args:
        provider: 사용할 Provider 이름 (gemini, groq, bedrock).
                  None이면 환경변수 LLM_PROVIDER 사용.

    Returns:
        BaseLLM 구현체 인스턴스 (Provider별 싱글톤)
    """
    target = (provider or settings.LLM_PROVIDER).lower()

    if target in _instances:
        return _instances[target]

    logger.info("LLM Provider 초기화: %s", target)

    if target == "gemini":
        from app.llm.gemini import GeminiLLM
        instance = GeminiLLM()

    elif target == "groq":
        from app.llm.groq import GroqLLM
        instance = GroqLLM()

    elif target == "bedrock":
        from app.llm.bedrock import BedrockLLM
        instance = BedrockLLM()

    else:
        raise ValueError(
            f"지원하지 않는 LLM Provider: '{target}'. "
            f"사용 가능: gemini, groq, bedrock"
        )

    _instances[target] = instance
    return instance
