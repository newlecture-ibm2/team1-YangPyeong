"""
LLM 추상 클래스.
모든 LLM Provider는 이 클래스를 상속합니다.
"""
from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """LLM Provider 추상 인터페이스."""

    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        프롬프트를 받아 텍스트 응답을 반환합니다.

        Args:
            prompt: LLM에 전달할 프롬프트 문자열
            **kwargs: temperature, max_tokens 등 Provider별 추가 옵션

        Returns:
            LLM 응답 텍스트
        """
        ...

    @abstractmethod
    async def generate_json(self, prompt: str, **kwargs) -> str:
        """
        프롬프트를 받아 JSON 형식의 텍스트를 반환합니다.
        JSON mode 지원 Provider는 해당 옵션을 활성화합니다.

        Args:
            prompt: LLM에 전달할 프롬프트 문자열
            **kwargs: Provider별 추가 옵션

        Returns:
            JSON 문자열
        """
        ...

    @abstractmethod
    def get_provider_name(self) -> str:
        """Provider 이름을 반환합니다 (예: 'gemini', 'groq')."""
        ...
