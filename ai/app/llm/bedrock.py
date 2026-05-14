"""
AWS Bedrock LLM Provider 구현체 (추후 구현용 스켈레톤)
boto3 SDK를 사용합니다.
"""

import logging
from typing import AsyncIterator, Optional

from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


class BedrockLLM(BaseLLM):
    """AWS Bedrock을 사용하는 LLM 구현체 (스켈레톤)"""

    def __init__(self) -> None:
        # boto3 import는 실제 사용 시점에 수행 (의존성 선택적 설치)
        logger.warning("BedrockLLM은 아직 구현되지 않았습니다. 추후 구현 예정.")
        raise NotImplementedError(
            "BedrockLLM은 아직 구현되지 않았습니다. "
            "구현 시 boto3, bedrock-runtime SDK가 필요합니다."
        )

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        raise NotImplementedError

    async def generate_stream(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        raise NotImplementedError
        yield  # AsyncIterator 타입 힌트를 위한 yield

    async def generate_json(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        raise NotImplementedError
