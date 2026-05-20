"""ReAct 에이전트 응답에서 텍스트 + 액션 안전 추출.

create_react_agent.ainvoke() 결과의 messages 리스트에서:
  1. 마지막 AIMessage의 content (cleaned text + actions)
  2. ToolMessage들의 텍스트·액션 (LLM이 본문을 누락한 경우 보완)
  3. 중복 액션 제거 후 병합

특히 Gemini가 종종 빈 AIMessage(tool_calls 없이) 를 반환하는 경우를 견고하게 처리.
모든 도메인 에이전트의 call_xxx_agent 래퍼에서 재사용 가능.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

# pyrefly: ignore [missing-import]
from langchain_core.messages import AIMessage, ToolMessage

from app.agents.shared.action_token import split_actions, sanitize_action_leakage

logger = logging.getLogger(__name__)


@dataclass
class AgentOutput:
    """에이전트 호출 후 정제된 응답.

    Fields:
        text         : 사용자에게 보낼 본문 (액션 토큰 제거됨)
        actions      : 프론트가 디스패치할 ChatAction dict 리스트
        had_ai_text  : 마지막 AIMessage에 본문이 있었는지 (디버깅용)
        had_tool_call: ToolMessage가 존재했는지 (LLM이 도구를 호출했는지)
    """
    text: str = ""
    actions: list[dict] = field(default_factory=list)
    had_ai_text: bool = False
    had_tool_call: bool = False


def _dedupe_actions(actions: list[dict]) -> list[dict]:
    """ACTION dict 리스트에서 중복 제거 (JSON 직렬화 기준)."""
    seen: set[str] = set()
    out: list[dict] = []
    for a in actions:
        key = json.dumps(a, sort_keys=True, ensure_ascii=False)
        if key not in seen:
            seen.add(key)
            out.append(a)
    return out


def _normalize_content(content: Any) -> str:
    """AIMessage나 ToolMessage의 content가 str 또는 복합 list[dict] 형태일 때 안전하게 문자열로 변환합니다."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict):
                if part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
                elif "text" in part:
                    text_parts.append(str(part["text"]))
        return "".join(text_parts)
    return str(content or "")


def extract_agent_output(
    messages: list[Any],
    default_text: str = "요청하신 작업을 처리했어요.",
) -> AgentOutput:
    """ReAct 에이전트 응답 messages에서 본문·액션을 안전하게 추출.

    동작:
      ① 마지막 AIMessage에서 텍스트·액션 추출
      ② 모든 ToolMessage에서 액션·텍스트 fallback 보강
      ③ AI 본문이 비었으면 마지막 tool 텍스트, 그것도 없으면 default_text
      ④ AI·tool 액션 병합 + 중복 제거

    Args:
        messages: response["messages"] (LangGraph agent 호출 결과)
        default_text: 본문이 전혀 추출되지 않았을 때 fallback 문구

    Returns:
        AgentOutput
    """
    # ① 마지막 AIMessage
    raw_ai_content = next(
        (m.content for m in reversed(messages) if isinstance(m, AIMessage)), ""
    ) or ""
    last_ai_content = _normalize_content(raw_ai_content)
    ai_text, ai_actions = split_actions(last_ai_content)

    # ② ToolMessage 순회 — 액션 수집 + 마지막 tool 텍스트를 fallback으로 보관
    tool_actions: list[dict] = []
    tool_text_fallback = ""
    had_tool_call = False
    for msg in messages:
        if isinstance(msg, ToolMessage):
            had_tool_call = True
            normalized_tool_content = _normalize_content(msg.content)
            t_text, t_acts = split_actions(normalized_tool_content)
            tool_actions.extend(t_acts)
            if t_text.strip():
                tool_text_fallback = t_text.strip()

    # ③ 본문 결정 우선순위: AI 텍스트 > tool 텍스트 > default
    had_ai_text = bool(ai_text)
    raw_text = ai_text or tool_text_fallback or default_text

    # ③-b 보안: Gemini가 [ACTION:...] 프리픽스 없이 JSON body만 복사한 경우 탐지·제거
    #   split_actions()가 처리하지 못한 유출 JSON을 후처리로 제거한다.
    sanitized_text, sanitized_actions = sanitize_action_leakage(raw_text)
    final_text = sanitized_text or default_text

    # ④ 액션 병합 (AI 우선, tool 보강, sanitize 추가) + 중복 제거
    merged_actions = _dedupe_actions(ai_actions + tool_actions + sanitized_actions)

    return AgentOutput(
        text=final_text,
        actions=merged_actions,
        had_ai_text=had_ai_text,
        had_tool_call=had_tool_call,
    )
