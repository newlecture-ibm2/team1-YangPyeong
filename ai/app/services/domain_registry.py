"""
STT 파싱 도메인 레지스트리.
새 도메인(스키마+프롬프트+sanitizer)을 등록하면 /api/parse/{domain} 엔드포인트가 자동 지원됩니다.
"""
import logging
from dataclasses import dataclass, field
from typing import Callable, Optional, Type

from pydantic import BaseModel

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """도메인별 LLM 튜닝 옵션. None이면 dispatcher 기본값 사용."""
    temperature: float = 0.2
    # gemini-2.5-flash는 thinking 토큰이 max_output_tokens 예산을 소모하므로
    # JSON 잘림 방지를 위해 충분히 크게 설정 (실제 JSON 응답은 200~300 토큰 수준)
    max_output_tokens: int = 8192


@dataclass
class DomainSpec:
    schema: Type[BaseModel]
    prompt: str
    sanitizer: Optional[Callable[[BaseModel], BaseModel]] = None
    llm_config: LLMConfig = field(default_factory=LLMConfig)


_REGISTRY: dict[str, DomainSpec] = {}


def register(domain: str, spec: DomainSpec) -> None:
    if domain in _REGISTRY:
        raise ValueError(f"domain already registered: {domain}")
    _REGISTRY[domain] = spec
    logger.info("STT domain registered: %s", domain)


def get(domain: str) -> DomainSpec:
    if domain not in _REGISTRY:
        raise KeyError(domain)
    return _REGISTRY[domain]


def is_registered(domain: str) -> bool:
    return domain in _REGISTRY
