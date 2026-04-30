"""
Google Gemini LLM Provider.
BaseLLM을 상속하여 Gemini API를 호출합니다.
google-generativeai 0.8.x SDK 사용.
"""
import logging

import google.generativeai as genai

from app.llm.base import BaseLLM
from app.config import get_settings

logger = logging.getLogger(__name__)


class GeminiLLM(BaseLLM):
    """Gemini 기반 LLM Provider."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(settings.gemini_model)

    async def generate(self, prompt: str, **kwargs) -> str:
        """Gemini에 프롬프트를 전달하고 텍스트 응답을 반환합니다."""
        try:
            temperature = kwargs.get("temperature", 0.3)
            max_tokens = kwargs.get("max_tokens", 4096)

            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            response = self._model.generate_content(
                prompt,
                generation_config=generation_config,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"[GeminiLLM] generate 실패: {e}")
            raise

    async def generate_json(self, prompt: str, **kwargs) -> str:
        """
        JSON 응답을 요구하는 프롬프트를 전달합니다.
        response_mime_type으로 JSON 형식을 강제합니다.
        """
        try:
            temperature = kwargs.get("temperature", 0.1)
            max_tokens = kwargs.get("max_tokens", 4096)

            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                response_mime_type="application/json",
            )

            response = self._model.generate_content(
                prompt,
                generation_config=generation_config,
            )
            return response.text or "{}"
        except Exception as e:
            logger.error(f"[GeminiLLM] generate_json 실패: {e}")
            raise

    def get_provider_name(self) -> str:
        return "gemini"
