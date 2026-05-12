"""
Gemini LLM Provider 구현체
google-generativeai SDK를 사용합니다.
"""

import logging
from typing import AsyncIterator, Any, Optional

import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


class GeminiLLM(BaseLLM):
    """Google Gemini API를 사용하는 LLM 구현체"""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model_name = settings.GEMINI_MODEL
        self._api_key = settings.GEMINI_API_KEY
        logger.info("GeminiLLM 초기화 완료 (모델: %s)", self._model_name)

    def get_chat_model(self, **kwargs: Any) -> ChatGoogleGenerativeAI:
        """LangChain 호환 Gemini ChatModel 반환"""
        return ChatGoogleGenerativeAI(
            model=self._model_name,
            google_api_key=self._api_key,
            **kwargs
        )

    def _get_model(
        self, system_instruction: Optional[str] = None
    ) -> genai.GenerativeModel:
        """GenerativeModel 인스턴스 생성"""
        return genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system_instruction,
        )

    async def generate(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        model = self._get_model(system_instruction)

        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            response = await model.generate_content_async(
                prompt,
                generation_config=generation_config,
            )
            return response.text
        except Exception as e:
            logger.error("Gemini generate 실패: %s", e)
            raise

    async def generate_stream(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        model = self._get_model(system_instruction)

        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            response = await model.generate_content_async(
                prompt,
                generation_config=generation_config,
                stream=True,
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error("Gemini generate_stream 실패: %s", e)
            raise
