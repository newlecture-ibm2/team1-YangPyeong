"""AI 재배 가이드 JSON 파싱·정규화"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.utils.json_utils import extract_json

logger = logging.getLogger(__name__)

_TOPIC_ICONS = {
    "토양": "🌍",
    "수분": "🌍",
    "병해충": "🐛",
    "꿀팁": "🚫",
    "초보": "🚫",
    "전문": "🎯",
    "경험": "🎯",
    "수확": "📦",
    "출하": "📦",
}


def _icon_for_title(title: str, experience_level: str) -> str:
    t = title or ""
    for key, icon in _TOPIC_ICONS.items():
        if key in t:
            if icon == "🚫" and experience_level == "experienced":
                return "🎯"
            return icon
    return "📌"


def _normalize_content(content: Any) -> list[str]:
    if content is None:
        return []
    if isinstance(content, str):
        lines = [ln.strip() for ln in content.split("\n") if ln.strip()]
        return lines if lines else [content.strip()]
    if isinstance(content, list):
        out: list[str] = []
        for item in content:
            if item is None:
                continue
            s = str(item).strip()
            if s:
                out.append(s)
        return out
    return []


def parse_crop_guide_response(raw: str, crop_name: str, experience_level: str) -> dict[str, Any] | None:
    if not raw or not raw.strip():
        return None

    data: Any = None
    try:
        data = extract_json(raw)
    except Exception:
        pass
    if data is None:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("재배 가이드 JSON 파싱 실패")
            return None

    if isinstance(data, dict) and "topics" in data:
        payload = data
    elif isinstance(data, dict) and "guide" in data and isinstance(data["guide"], dict):
        payload = data["guide"]
    else:
        return None

    topics_in = payload.get("topics")
    if not isinstance(topics_in, list):
        return None

    topics: list[dict[str, Any]] = []
    for item in topics_in:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        content = _normalize_content(item.get("content"))
        if len(content) < 2:
            continue
        icon = str(item.get("icon") or "").strip() or _icon_for_title(title, experience_level)
        topics.append({"icon": icon, "title": title, "content": content})

    if len(topics) < 3:
        return None

    name = str(payload.get("crop_name") or crop_name).strip() or crop_name
    return {"crop_name": name, "topics": topics[:4]}


def default_tips_title(experience_level: str) -> str:
    if experience_level == "experienced":
        return "재배 경험자·전문가 꿀팁"
    return "초보 농부 실패 방지 꿀팁"
