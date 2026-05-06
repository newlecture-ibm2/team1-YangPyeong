"""
LLM 추상 클래스 (BaseLLM)
모든 LLM Provider는 이 클래스를 상속하여 구현합니다.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional


class BaseLLM(ABC):
    """LLM Provider 공통 인터페이스"""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """프롬프트를 받아 텍스트 응답을 생성합니다."""
        ...

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """프롬프트를 받아 스트리밍 응답을 생성합니다."""
        ...
