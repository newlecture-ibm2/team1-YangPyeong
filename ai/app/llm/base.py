"""
LLM 추상 클래스 (BaseLLM)
모든 LLM Provider는 이 클래스를 상속하여 구현합니다.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Any, Optional
from langchain_core.language_models import BaseChatModel


class BaseLLM(ABC):
    """LLM Provider 공통 인터페이스"""

    @abstractmethod
    def get_chat_model(self, **kwargs: Any) -> BaseChatModel:
        """
        LangChain 호환 ChatModel 인스턴스를 반환합니다.
        MAS(멀티 에이전트) 및 Tool Binding에 사용됩니다.
        """
        ...

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """
        프롬프트를 받아 텍스트 응답을 생성합니다.

        Args:
            prompt: 사용자 프롬프트
            system_instruction: 시스템 지시문 (선택)
            temperature: 창의성 (0.0 ~ 1.0)
            max_tokens: 최대 토큰 수

        Returns:
            생성된 텍스트 응답
        """
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
        """
        프롬프트를 받아 스트리밍 응답을 생성합니다.

        Args:
            prompt: 사용자 프롬프트
            system_instruction: 시스템 지시문 (선택)
            temperature: 창의성 (0.0 ~ 1.0)
            max_tokens: 최대 토큰 수

        Yields:
            텍스트 청크
        """
        ...
