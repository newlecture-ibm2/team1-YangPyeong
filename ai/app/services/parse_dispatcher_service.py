"""
STT 파싱 Dispatcher 서비스.
domain_registry에서 (schema, prompt, sanitizer)를 조회해 Gemini에 위임합니다.
기존 서비스 패턴과 동일: self.llm = get_llm()
"""
import json
import logging
from pydantic import BaseModel, ValidationError

from app.llm import get_llm
from app.services import domain_registry

logger = logging.getLogger(__name__)


class ParseDispatcherService:
    def __init__(self) -> None:
        self.llm = get_llm()

    async def parse(
        self,
        domain: str,
        *,
        text: str | None = None,
        audio: bytes | None = None,
        mime: str | None = None,
        context: dict | None = None,
    ) -> BaseModel:
        spec = domain_registry.get(domain)
        cfg = spec.llm_config

        # 프롬프트 빌드 (context 치환)
        try:
            prompt = spec.prompt.format(**(context or {}))
        except KeyError as e:
            logger.error("프롬프트 포맷 키 누락: %s", e)
            prompt = spec.prompt

        try:
            if audio and mime:
                # 오디오 직접 입력 — Gemini 멀티모달 (STT + 파싱 1-call)
                raw_json = await self.llm.generate_json(
                    prompt=prompt,
                    file_bytes=audio,
                    mime_type=mime,
                    temperature=cfg.temperature,
                    max_tokens=cfg.max_output_tokens,
                )
            else:
                # 텍스트 입력
                user_text = f"[사용자 발화]\n{text or ''}"
                raw_json = await self.llm.generate_json(
                    prompt=f"{prompt}\n\n{user_text}",
                    temperature=cfg.temperature,
                    max_tokens=cfg.max_output_tokens,
                )
        except Exception as e:
            logger.error("Gemini 파싱 실패 (domain=%s): %s", domain, e)
            raise

        try:
            parsed = spec.schema.model_validate_json(raw_json)
        except (ValidationError, json.JSONDecodeError) as e:
            logger.error("응답 파싱 실패 (domain=%s): %s | raw=%s", domain, e, raw_json[:200])
            raise ValueError(f"LLM 응답을 파싱할 수 없습니다: {e}") from e

        return spec.sanitizer(parsed) if spec.sanitizer else parsed


# 모듈 레벨 싱글톤 — 매 요청마다 인스턴스 생성 비용 제거 (P13)
_service = ParseDispatcherService()


def get_parse_dispatcher() -> ParseDispatcherService:
    return _service
