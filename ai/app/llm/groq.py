"""
Groq LLM Provider 구현체
groq SDK를 사용합니다. (챗봇용 — 빠른 응답 속도)
"""

import logging
from typing import AsyncIterator, Optional

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

    def get_chat_model(self, temperature: float = 0.7):
        """LangChain Chat Model 인스턴스 반환"""
        return ChatGroq(
            model=self._model_name,
            temperature=temperature,
            groq_api_key=self._api_key
        )

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
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
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            logger.error("Groq generate_stream 실패: %s", e)
            raise
