"""ACTION 토큰 직렬화·파싱 — 모든 도메인 에이전트에서 공용.

도구(Tool)가 답변에 "[ACTION:{...json...}]" 토큰을 끼워넣으면, 오케스트레이터가
이를 추출해 ChatAction[]으로 변환한다. 프론트엔드 디스패처(useChatActions)가
받아서 NAVIGATE / TOAST / FILL_FORM / CLARIFY 등으로 실행한다.

JSON이 중첩 구조(객체·배열)를 포함할 수 있으므로 정규식 lazy 매칭으로는 부정확.
json.JSONDecoder.raw_decode 로 balanced bracket 파싱한다.
"""
from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_ACTION_PREFIX = "[ACTION:"
_ACTION_DECODER = json.JSONDecoder()


def action_token(payload: dict[str, Any]) -> str:
    """ChatAction dict → "[ACTION:{...}]" 토큰 문자열로 직렬화."""
    return f"[ACTION:{json.dumps(payload, ensure_ascii=False)}]"


def split_actions(text: str) -> tuple[str, list[dict]]:
    """텍스트에서 [ACTION:{...}] 토큰을 모두 추출.

    Returns:
        (cleaned_text, actions): 액션 토큰이 제거된 본문과 파싱된 액션 dict 리스트
    """
    if not text:
        return "", []

    actions: list[dict] = []
    out_parts: list[str] = []
    i = 0
    n = len(text)

    while i < n:
        start = text.find(_ACTION_PREFIX, i)
        if start == -1:
            out_parts.append(text[i:])
            break

        # [ACTION: 앞부분은 본문 텍스트
        out_parts.append(text[i:start])
        json_start = start + len(_ACTION_PREFIX)

        try:
            obj, json_end = _ACTION_DECODER.raw_decode(text, json_start)
        except json.JSONDecodeError as e:
            logger.warning(
                "[ActionToken] JSON 파싱 실패(@%d): %s — %s",
                json_start, text[json_start:json_start + 80], e,
            )
            i = start + len(_ACTION_PREFIX)
            continue

        # raw_decode 직후에 닫는 ']' 가 있어야 정상 토큰
        if json_end < n and text[json_end] == "]":
            actions.append(obj)
            i = json_end + 1
        else:
            logger.warning(
                "[ActionToken] 종료 ']' 누락 (@%d): %s",
                json_end, text[max(0, json_end - 20):json_end + 5],
            )
            i = start + len(_ACTION_PREFIX)

    cleaned = "".join(out_parts).strip()
    return cleaned, actions
