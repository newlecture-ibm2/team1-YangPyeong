"""PendingIntent 슬롯이 모두 채워졌을 때 도구를 실행하기 위한 디스패처.

도메인은 `register_tool()`로 자기 도구를 등록.
"""
from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)

ToolCallable = Callable[..., Awaitable[str]]
_REGISTRY: dict[str, ToolCallable] = {}


def register_tool(name: str, fn: ToolCallable) -> None:
    """도구 이름으로 호출 가능한 비동기 함수를 등록."""
    _REGISTRY[name] = fn


def register_tools(mapping: dict[str, ToolCallable]) -> None:
    """여러 도구 일괄 등록."""
    _REGISTRY.update(mapping)


async def invoke(name: str, **kwargs: Any) -> str:
    """등록된 도구를 인자와 함께 호출.

    LangChain `@tool` 데코레이터로 만들어진 도구는 ainvoke({...}) 형태로 받음.
    """
    tool_fn = _REGISTRY.get(name)
    if tool_fn is None:
        logger.warning("[ToolDispatcher] '%s' 도구가 등록되지 않음", name)
        return f"'{name}' 기능을 실행하지 못했어요."

    # LangChain Tool 객체인 경우 ainvoke 사용
    if hasattr(tool_fn, "ainvoke"):
        return await tool_fn.ainvoke(kwargs)
    return await tool_fn(**kwargs)
