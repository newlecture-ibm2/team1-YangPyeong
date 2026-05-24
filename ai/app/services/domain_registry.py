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
    # gemini-2.5-flash는 thinking 토큰이 max_output_tokens 예산을 공유한다.
    # 복잡한 SYSTEM_PROMPT 분석 시 thinking이 7000~8000 토큰을 소모해
    # 실제 JSON 출력 공간이 부족해지는 현상이 재현됨.
    # google-generativeai 0.8.x SDK는 thinking_config(=thinking_budget: 0)를 지원하지 않으므로
    # 모델 최대 출력 한도(65,536)로 예산을 설정해 thinking+JSON 공간을 모두 확보한다.
    max_output_tokens: int = 65536


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
