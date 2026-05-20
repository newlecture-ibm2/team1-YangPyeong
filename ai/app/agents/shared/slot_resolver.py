"""다중 턴 슬롯 채우기 — 도메인 무관 공통 인프라.

`PendingIntent`가 살아있는 동안, 다음 사용자 메시지에서 미충족 슬롯을 추출하여
도구를 자동 재호출할 수 있게 한다.

도메인은 `register_slot_extractors()`로 자기 슬롯 추출기를 등록하기만 하면 됨.
"""
from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable

from app.models.chat import PendingIntent

logger = logging.getLogger(__name__)

# 슬롯 추출기 타입: 사용자 메시지 + 이미 채워진 슬롯 → 추출값 또는 None
SlotExtractor = Callable[[str, dict[str, Any]], Any]
AsyncSlotExtractor = Callable[[str, dict[str, Any]], Awaitable[Any]]

# 도메인별 슬롯 추출기 레지스트리: {domain: {slot_name: extractor}}
_REGISTRY: dict[str, dict[str, SlotExtractor | AsyncSlotExtractor]] = {}


def register_slot_extractors(
    domain: str,
    extractors: dict[str, SlotExtractor | AsyncSlotExtractor],
) -> None:
    """도메인의 슬롯 추출기를 등록.

    Args:
        domain: 도메인 식별자 (예: 'shop', 'farm')
        extractors: {슬롯명: 추출 함수} 매핑. 동기/비동기 함수 모두 가능.
    """
    _REGISTRY.setdefault(domain, {}).update(extractors)
    logger.info("[SlotResolver] %s 도메인 추출기 %d개 등록", domain, len(extractors))


async def resolve_pending(
    pending: PendingIntent,
    user_message: str,
) -> PendingIntent:
    """미충족 슬롯을 user_message에서 추출해 채운다.

    Returns:
        업데이트된 PendingIntent (missing이 빈 리스트면 완성된 것)
    """
    import inspect

    extractors = _REGISTRY.get(pending.domain or "", {})
    new_filled = dict(pending.filled)
    new_missing: list[str] = []

    for slot in pending.missing:
        extractor = extractors.get(slot)
        if extractor is None:
            new_missing.append(slot)
            continue

        try:
            value = extractor(user_message, new_filled)
            if inspect.isawaitable(value):
                value = await value
        except Exception as e:
            logger.warning("[SlotResolver] %s.%s 추출 실패: %s", pending.domain, slot, e)
            value = None

        if value is None or value == "":
            new_missing.append(slot)
        else:
            new_filled[slot] = value

    return PendingIntent(
        tool=pending.tool,
        filled=new_filled,
        missing=new_missing,
        prompts=pending.prompts,
        domain=pending.domain,
    )


def is_complete(pending: PendingIntent) -> bool:
    """모든 슬롯이 채워졌는지 확인."""
    return not pending.missing


def next_prompt(pending: PendingIntent) -> str:
    """남은 슬롯 중 첫 번째에 대한 질문 텍스트."""
    if not pending.missing:
        return ""
    first = pending.missing[0]
    return pending.prompts.get(first, f"'{first}' 값을 알려주세요.")
