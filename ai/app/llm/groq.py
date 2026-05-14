"""
Groq LLM Provider 구현체
groq SDK를 사용합니다.
"""

import logging
from typing import AsyncIterator, Any, Optional

from groq import AsyncGroq
from langchain_groq import ChatGroq

from app.config import get_settings
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


class GroqLLM(BaseLLM):
    """Groq API를 사용하는 LLM 구현체"""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY 환경변수가 설정되지 않았습니다.")

        self._api_key = settings.GROQ_API_KEY
        self._client = AsyncGroq(api_key=self._api_key)
        self._model_name = settings.GROQ_MODEL
        logger.info("GroqLLM 초기화 완료 (모델: %s)", self._model_name)

    def get_chat_model(self, **kwargs: Any) -> ChatGroq:
        """LangChain 호환 Groq ChatModel 반환"""
        return ChatGroq(
            model=self._model_name,
            groq_api_key=self._api_key,
            **kwargs
        )

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """프롬프트를 받아 텍스트 응답을 생성합니다."""
        # Groq는 현재 system_instruction을 메시지 리스트에 포함해야 함
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            completion = await self._client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error("Groq generate 실패: %s", e)
            raise

    async def generate_stream(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """프롬프트를 받아 스트리밍 응답을 생성합니다."""
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self._client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error("Groq generate_stream 실패: %s", e)
            raise

    async def generate_json(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> str:
        """Groq JSON 모드를 사용하여 JSON 응답을 생성합니다."""
        
        # Groq 필수 요구사항: 프롬프트에 'JSON' 단어가 명시되어야 함
        refined_system_instruction = system_instruction or "You are a helpful assistant that outputs JSON."
        if "json" not in refined_system_instruction.lower():
            refined_system_instruction += " Always respond in valid JSON format."

        messages = [
            {"role": "system", "content": refined_system_instruction},
            {"role": "user", "content": prompt}
        ]

        try:
            completion = await self._client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error("Groq generate_json 실패: %s", e)
            raise
