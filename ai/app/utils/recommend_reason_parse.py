"""추천 사유 배치 JSON 정규화"""

from __future__ import annotations

import re
from typing import Any

from app.utils.json_utils import extract_json

# 과거 버전·다계층 폴백에서 DB에 저장된 플레이스홀더 (신규 응답에는 사용하지 않음)
GENERIC_REASON_FALLBACK = "현재 농장 데이터를 바탕으로 분석한 결과입니다."
_REASON_JSON_KEYS = ("ai_reason", "reason", "comment", "analysis", "text", "message")


def is_placeholder_reason(text: str | None) -> bool:
    t = (text or "").strip()
    if not t:
        return True
    if t == GENERIC_REASON_FALLBACK:
        return True
    if "AI 분석 중 오류가 발생했습니다" in t:
        return True
    return False


def normalize_reason_text(text: str | None) -> str:
    """LLM 응답(평문·JSON)에서 표시용 사유 문자열만 추출합니다."""
    raw = (text or "").strip()
    if not raw:
        return ""
    if raw.startswith("{"):
        try:
            parsed = extract_json(raw)
            if isinstance(parsed, dict):
                for key in _REASON_JSON_KEYS:
                    val = parsed.get(key)
                    if isinstance(val, str) and val.strip():
                        return val.strip()
                for val in parsed.values():
                    if isinstance(val, str) and len(val.strip()) >= 12:
                        return val.strip()
        except Exception:
            pass
    if is_placeholder_reason(raw):
        return ""
    return raw


def _norm_crop_key(name: str) -> str:
    return re.sub(r"\s+", "", (name or "").strip())


def _pick_string(value: Any) -> str | None:
    if isinstance(value, str):
        s = value.strip()
        return s if s else None
    return None


def align_reasons_to_crops(parsed: Any, crop_names: list[str]) -> dict[str, str]:
    """LLM JSON을 작물명 → 사유 맵으로 정렬합니다(키 변형·중첩 reasons 허용)."""
    if not crop_names:
        return {}

    raw: dict[str, Any] = {}
    if isinstance(parsed, dict):
        raw = dict(parsed)
        inner = parsed.get("reasons")
        if isinstance(inner, dict):
            raw.update(inner)

    if not raw:
        return {}

    norm_index: dict[str, str] = {}
    for key, value in raw.items():
        text = _pick_string(value)
        if not text:
            continue
        norm_index[_norm_crop_key(str(key))] = text

    out: dict[str, str] = {}
    for name in crop_names:
        if name in raw:
            text = _pick_string(raw[name])
            if text:
                out[name] = text
                continue
        hit = norm_index.get(_norm_crop_key(name))
        if hit:
            out[name] = hit
    return out


def parse_batch_reasons_response(text: str, crop_names: list[str]) -> dict[str, str]:
    parsed = extract_json(text or "")
    return align_reasons_to_crops(parsed, crop_names)
