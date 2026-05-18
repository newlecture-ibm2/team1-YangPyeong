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

    async def generate_json(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> str:
        """
        프롬프트를 받아 JSON 형식의 텍스트 응답을 생성합니다.
        기본적으로 일반 generate()를 호출하지만, 각 Provider(Gemini 등)에서 
        네이티브 JSON 모드를 오버라이딩하여 사용할 수 있습니다.
        
        Args:
            prompt: 사용자 프롬프트
            system_instruction: 시스템 지시문 (선택)
            temperature: 창의성 (0.0 ~ 1.0, JSON의 경우 주로 0.1 사용)
            max_tokens: 최대 토큰 수
            file_bytes: 파일 바이트 데이터 (이미지/PDF 등, 선택)
            mime_type: 파일 MIME 타입 (선택)

        Returns:
            JSON 형식의 텍스트 응답
        """
        # BaseLLM의 기본 구현은 파일을 지원하지 않으므로, 파일이 전달되면 예외 발생
        if file_bytes is not None:
            raise NotImplementedError("해당 Provider는 파일 첨부를 지원하지 않습니다.")
        
        return await self.generate(
            prompt,
            system_instruction=system_instruction,
            temperature=temperature,
            max_tokens=max_tokens,
        )
