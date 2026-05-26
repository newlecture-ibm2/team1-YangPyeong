"""ACTION 토큰 직렬화·파싱 — 모든 도메인 에이전트에서 공용.

도구(Tool)가 답변에 "[ACTION:{...json...}]" 토큰을 끼워넣으면, 오케스트레이터가
이를 추출해 ChatAction[]으로 변환한다. 프론트엔드 디스패처(useChatActions)가
받아서 NAVIGATE / TOAST / FILL_FORM / CLARIFY 등으로 실행한다.

JSON이 중첩 구조(객체·배열)를 포함할 수 있으므로 정규식 lazy 매칭으로는 부정확.
json.JSONDecoder.raw_decode 로 balanced bracket 파싱한다.

[보안 참고]
Gemini는 종종 [ACTION:{...}] 토큰의 "[ACTION:" 프리픽스를 제거하고 JSON body만
AIMessage에 그대로 포함시킨다. split_actions()가 매칭에 실패하면 raw JSON이
사용자 화면에 그대로 노출(정보 유출, XSS 위험)된다.
sanitize_action_leakage()를 extract_agent_output() 단계에서 반드시 적용할 것.
"""
from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_ACTION_PREFIX = "[ACTION:"
_PENDING_PREFIX = "[PENDING_INTENT:"
_ACTION_DECODER = json.JSONDecoder()


def pending_intent_token(payload: dict[str, Any]) -> str:
    """PendingIntent dict → '[PENDING_INTENT:{...}]' 토큰 문자열로 직렬화."""
    return f"[PENDING_INTENT:{json.dumps(payload, ensure_ascii=False)}]"


def split_pending_intent(text: str) -> tuple[str, dict | None]:
    """텍스트에서 [PENDING_INTENT:{...}] 토큰을 추출 (마지막 하나만).

    Returns:
        (cleaned_text, pending_intent_dict_or_None)
    """
    if not text or _PENDING_PREFIX not in text:
        return text, None

    start = text.rfind(_PENDING_PREFIX)
    json_start = start + len(_PENDING_PREFIX)
    try:
        obj, json_end = _ACTION_DECODER.raw_decode(text, json_start)
    except json.JSONDecodeError as e:
        logger.warning("[PendingIntent] JSON 파싱 실패: %s", e)
        return text, None

    if json_end < len(text) and text[json_end] == "]":
        cleaned = (text[:start] + text[json_end + 1:]).strip()
        return cleaned, obj
    return text, None

# 프론트엔드 ChatActionType과 1:1 대응 — 여기에 없는 type은 action으로 간주하지 않음
_KNOWN_ACTION_TYPES: frozenset[str] = frozenset({
    "NAVIGATE", "FILL_FORM", "TOAST", "REFRESH",
    "CLARIFY", "CONFIRM", "OPEN_MODAL", "PRODUCT_LIST",
    "RECOMMEND_CHART",
})


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


def sanitize_action_leakage(text: str) -> tuple[str, list[dict]]:
    """LLM이 [ACTION:{...}] 프리픽스를 제거하고 JSON body만 출력한 경우 탐지·제거.

    Gemini는 tool result의 [ACTION:...] 토큰을 AIMessage에 복사할 때
    "[ACTION:" 프리픽스를 빼고 raw JSON만 포함시키는 경우가 있다.
    split_actions()는 프리픽스가 없으면 매칭하지 못하므로 JSON이 그대로 노출된다.

    이 함수는 텍스트 내에서 ChatAction 스키마에 맞는 JSON 객체({type: "KNOWN_TYPE", ...})를
    찾아 텍스트에서 제거하고 별도 actions 리스트로 반환한다.

    주의:
    - json.JSONDecoder.raw_decode로 중첩 JSON도 정확히 처리
    - _KNOWN_ACTION_TYPES에 없는 type은 제거하지 않음 (일반 JSON 내용 보호)
    - 앞뒤 [ ] 브래킷이 붙어있는 경우도 처리

    Returns:
        (sanitized_text, leaked_actions)
    """
    if not text or "{" not in text:
        return text, []

    leaked_actions: list[dict] = []
    out_parts: list[str] = []
    i = 0
    n = len(text)

    while i < n:
        brace_pos = text.find("{", i)
        if brace_pos == -1:
            out_parts.append(text[i:])
            break

        # 앞부분은 그대로 유지 (단, 직전 '[' 브래킷은 action 묶음일 수 있으니 검사)
        prefix_text = text[i:brace_pos]
        # 직전 문자가 '[' 이고 그게 [ACTION: 프리픽스가 아닌 경우 → 혹시 모를 '[{...}]' 패턴
        stripped_bracket = prefix_text.endswith("[") or (brace_pos > 0 and text[brace_pos - 1] == "[")

        try:
            obj, end_pos = _ACTION_DECODER.raw_decode(text, brace_pos)
        except json.JSONDecodeError:
            # JSON 파싱 실패 → '{' 문자 자체는 일반 텍스트
            out_parts.append(text[i:brace_pos + 1])
            i = brace_pos + 1
            continue

        if not isinstance(obj, dict) or obj.get("type") not in _KNOWN_ACTION_TYPES:
            # ChatAction이 아닌 일반 JSON → 건드리지 않음
            out_parts.append(text[i:brace_pos + 1])
            i = brace_pos + 1
            continue

        # ChatAction JSON 발견 → 텍스트에서 제거
        leaked_actions.append(obj)
        logger.warning(
            "[ActionSanitize] 유출된 ChatAction JSON 탐지·제거: type=%s (@%d)",
            obj.get("type"), brace_pos,
        )

        # 직전 '[' 브래킷 제거
        if stripped_bracket and prefix_text.endswith("["):
            out_parts.append(prefix_text[:-1])
        else:
            out_parts.append(prefix_text)

        # 직후 ']' 브래킷 건너뜀
        i = end_pos
        if i < n and text[i] == "]":
            i += 1

    sanitized = "".join(out_parts).strip()
    if leaked_actions:
        logger.warning(
            "[ActionSanitize] 총 %d개 유출 action 제거 완료. 원본 길이=%d → 정제 길이=%d",
            len(leaked_actions), len(text), len(sanitized),
        )
    return sanitized, leaked_actions
