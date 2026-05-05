"""
Groq LLM Provider 구현체 (추후 구현용 스켈레톤)
"""

import logging
from typing import AsyncIterator, Optional

from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


class GroqLLM(BaseLLM):
    """Groq을 사용하는 LLM 구현체 (스켈레톤)"""

    def __init__(self) -> None:
        raise NotImplementedError(
            "GroqLLM은 아직 구현되지 않았습니다. "
            "구현 시 groq SDK가 필요합니다."
        )

    async def generate(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError

    async def generate_stream(self, prompt: str, **kwargs) -> AsyncIterator[str]:
        raise NotImplementedError
        yield
