"""
LLM 팩토리.
환경변수 LLM_PROVIDER에 따라 적절한 LLM 구현체를 반환합니다.
"""
from app.llm.base import BaseLLM
from app.config import get_settings


def get_llm() -> BaseLLM:
    """
    설정된 Provider에 해당하는 LLM 인스턴스를 반환합니다.

    환경변수 LLM_PROVIDER 값:
    - gemini (기본값)
    - groq
    - bedrock

    Returns:
        BaseLLM 구현체 인스턴스
    """
    settings = get_settings()
    provider = settings.llm_provider.lower()

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
        raise ValueError(f"지원하지 않는 LLM Provider: {provider}")
