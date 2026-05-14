import json
import re
from typing import Any


def _loads_dict(s: str) -> dict:
    s = s.strip()
    if not s:
        return {}
    try:
        data: Any = json.loads(s)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _dict_from_raw_decode(text: str) -> dict:
    """앞뒤 잡음이 있어도 첫 번째 유효한 JSON 객체를 raw_decode로 잡습니다."""
    idx = 0
    while True:
        idx = text.find("{", idx)
        if idx == -1:
            return {}
        try:
            obj, _end = json.JSONDecoder().raw_decode(text, idx)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
        idx += 1


def extract_json(text: str) -> dict:
    """LLM 응답에서 JSON 객체(dict)를 추출합니다."""
    if text is None or not isinstance(text, str) or not text.strip():
        return {}

    cleaned = text.strip()

    # ```json ... ``` 또는 ``` ... ``` (펜스만 있는 경우)
    for pattern in (r"```(?:json)?\s*([\s\S]*?)```",):
        match = re.search(pattern, cleaned, re.IGNORECASE)
        if match:
            inner = match.group(1).strip()
            parsed = _loads_dict(inner)
            if parsed:
                return parsed
            parsed = _dict_from_raw_decode(inner)
            if parsed:
                return parsed

    parsed = _loads_dict(cleaned)
    if parsed:
        return parsed

    parsed = _dict_from_raw_decode(cleaned)
    if parsed:
        return parsed

    # 레거시: 첫 { ~ 마지막 } (중첩 객체가 단순할 때 보조)
    first = cleaned.find("{")
    last = cleaned.rfind("}")
    if first != -1 and last > first:
        parsed = _loads_dict(cleaned[first : last + 1])
        if parsed:
            return parsed

    return {}
