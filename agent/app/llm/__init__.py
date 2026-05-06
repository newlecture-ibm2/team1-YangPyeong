"""
LLM Provider 팩토리
환경변수 LLM_PROVIDER에 따라 적절한 LLM 구현체를 반환합니다.

사용법:
    from app.llm import get_llm
    llm = get_llm()
    result = await llm.generate("질문")
"""

import logging
from functools import lru_cache

from app.config import settings
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_llm() -> BaseLLM:
    """환경변수 LLM_PROVIDER에 따라 LLM 인스턴스를 반환합니다."""
    provider = settings.LLM_PROVIDER.lower()
    logger.info("LLM Provider 초기화: %s", provider)

    if provider == "gemini":
        from app.llm.gemini import GeminiLLM
        return GeminiLLM()
    elif provider == "groq":
        from app.llm.groq import GroqLLM
        return GroqLLM()
    elif provider == "bedrock":
        from app.llm.bedrock import BedrockLLM
        return BedrockLLM()
    else:
        raise ValueError(
            f"지원하지 않는 LLM Provider: '{provider}'. "
            f"사용 가능: gemini, groq, bedrock"
        )
