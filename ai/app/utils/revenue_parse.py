"""
LLM 수익 예측 JSON 추출·키 정규화
"""

from __future__ import annotations

import json
import re
from typing import Any, Iterator

from app.utils.json_utils import extract_json

_INSIGHT_MIN_LEN = 20

_NUMERIC_FIELD_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("predicted_yield_kg", re.compile(r'"predicted_yield_kg"\s*:\s*([\d.]+)', re.I)),
    ("predicted_price_per_kg", re.compile(r'"predicted_price_per_kg"\s*:\s*([\d.]+)', re.I)),
    ("predicted_revenue", re.compile(r'"predicted_revenue"\s*:\s*([\d.]+)', re.I)),
)

_STRING_FIELD_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("price_insight", re.compile(r'"price_insight"\s*:\s*"((?:[^"\\]|\\.)*)', re.I)),
    ("revenue_insight", re.compile(r'"revenue_insight"\s*:\s*"((?:[^"\\]|\\.)*)', re.I)),
    ("confidence", re.compile(r'"confidence"\s*:\s*"([^"]*)"', re.I)),
)

_YIELD_FACTOR_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "planting_time_impact",
        re.compile(r'"planting_time_impact"\s*:\s*"((?:[^"\\]|\\.)*)', re.I),
    ),
    ("weather_impact", re.compile(r'"weather_impact"\s*:\s*"((?:[^"\\]|\\.)*)', re.I)),
    (
        "overall_adjustment",
        re.compile(r'"overall_adjustment"\s*:\s*"((?:[^"\\]|\\.)*)', re.I),
    ),
)


def _to_snake(name: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name.strip())
    return s.replace("-", "_").lower()


def _as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _as_int(value: Any) -> int | None:
    f = _as_float(value)
    if f is None:
        return None
    return int(round(f))


def _as_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _unwrap_nested_dict(data: dict) -> dict:
    """래퍼 키(data/result 등) 안쪽 필드를 바깥과 병합합니다."""
    merged = dict(data)
    for wrap_key in ("data", "result", "response", "prediction", "output"):
        inner = data.get(wrap_key)
        if not isinstance(inner, dict):
            continue
        for key, value in inner.items():
            if key not in merged or merged.get(key) in (None, "", {}, []):
                merged[key] = value
        merged.pop(wrap_key, None)
    return merged


def normalize_revenue_dict(data: Any) -> dict:
    """camelCase·중첩 래퍼를 표준 snake_case 스키마로 통일합니다."""
    if not isinstance(data, dict):
        return {}

    data = _unwrap_nested_dict(data)
    flat: dict[str, Any] = {}
    for key, value in data.items():
        if not isinstance(key, str):
            continue
        flat[_to_snake(key)] = value

    yield_factors = flat.get("yield_factors")
    if not isinstance(yield_factors, dict):
        yield_factors = {}

    if isinstance(yield_factors, dict):
        yield_factors = {
            _to_snake(str(k)): _as_str(v) for k, v in yield_factors.items() if v
        }

    return {
        "predicted_yield_kg": _as_float(
            flat.get("predicted_yield_kg")
            or flat.get("predicted_yield")
            or flat.get("yield_kg")
            or flat.get("expected_yield_kg")
        ),
        "predicted_price_per_kg": _as_int(
            flat.get("predicted_price_per_kg")
            or flat.get("price_per_kg")
            or flat.get("unit_price")
            or flat.get("kamis_price")
        ),
        "predicted_revenue": _as_int(
            flat.get("predicted_revenue")
            or flat.get("revenue")
            or flat.get("total_revenue")
            or flat.get("expected_revenue")
        ),
        "price_insight": _as_str(
            flat.get("price_insight")
            or flat.get("price_outlook")
            or flat.get("market_insight")
        ),
        "revenue_insight": _as_str(
            flat.get("revenue_insight")
            or flat.get("profit_insight")
            or flat.get("income_insight")
        ),
        "confidence": _as_str(flat.get("confidence")) or "보통",
        "yield_factors": yield_factors if isinstance(yield_factors, dict) else {},
    }


def _score_revenue_dict(norm: dict) -> int:
    score = 0
    if norm.get("price_insight"):
        score += 4
    if norm.get("revenue_insight"):
        score += 4
    if norm.get("predicted_yield_kg"):
        score += 2
    if norm.get("predicted_price_per_kg"):
        score += 2
    if norm.get("predicted_revenue"):
        score += 2
    if norm.get("yield_factors"):
        score += 1
    return score


def _try_close_truncated_json(text: str) -> dict:
    """잘린 JSON 끝에 닫는 괄호·따옴표를 보수해 파싱을 시도합니다."""
    start = text.find("{")
    if start == -1:
        return {}
    fragment = text[start:].strip()
    fragment = re.sub(r',?\s*"[^"]*"\s*:\s*"[^"]*$', "", fragment)
    fragment = re.sub(r',?\s*"[^"]*"\s*:\s*$', "", fragment)
    fragment = fragment.rstrip().rstrip(",")
    for suffix in ('"}', '"}}', '"}]}', "}}", "}", '"]}'):
        try:
            obj, _ = json.JSONDecoder().raw_decode(fragment + suffix)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue
    return {}


def salvage_revenue_fields(text: str) -> dict:
    """유효 JSON 파싱이 실패했을 때 잘린 응답에서 핵심 필드를 추출합니다."""
    if not text or not isinstance(text, str):
        return {}

    raw: dict[str, Any] = {}
    for key, pattern in _NUMERIC_FIELD_PATTERNS:
        match = pattern.search(text)
        if match:
            raw[key] = match.group(1)

    for key, pattern in _STRING_FIELD_PATTERNS:
        match = pattern.search(text)
        if match:
            raw[key] = match.group(1).replace("\\n", " ").replace('\\"', '"').strip()

    yield_factors: dict[str, str] = {}
    for key, pattern in _YIELD_FACTOR_PATTERNS:
        match = pattern.search(text)
        if match:
            yield_factors[key] = (
                match.group(1).replace("\\n", " ").replace('\\"', '"').strip()
            )
    if yield_factors:
        raw["yield_factors"] = yield_factors

    return normalize_revenue_dict(raw)


def iter_json_dicts(text: str) -> Iterator[dict]:
    if not text or not isinstance(text, str):
        return
    idx = 0
    while idx < len(text):
        idx = text.find("{", idx)
        if idx == -1:
            break
        try:
            obj, end = json.JSONDecoder().raw_decode(text, idx)
            if isinstance(obj, dict):
                yield obj
            idx = max(end, idx + 1)
        except json.JSONDecodeError:
            idx += 1


def extract_revenue_json(text: str) -> dict:
    """
    응답 안의 여러 JSON 객체 중 수익 예측 스키마에 가장 가까운 dict를 선택합니다.
    """
    best_norm: dict = {}
    best_score = -1

    for candidate in iter_json_dicts(text):
        norm = normalize_revenue_dict(candidate)
        score = _score_revenue_dict(norm)
        if score > best_score:
            best_score = score
            best_norm = norm

    if best_score > 0:
        return best_norm

    fallback = normalize_revenue_dict(extract_json(text))
    fallback_score = _score_revenue_dict(fallback)
    if fallback_score > best_score:
        best_norm = fallback
        best_score = fallback_score

    repaired = normalize_revenue_dict(_try_close_truncated_json(text))
    repaired_score = _score_revenue_dict(repaired)
    if repaired_score > best_score:
        best_norm = repaired
        best_score = repaired_score

    if best_score > 0:
        return best_norm

    salvaged = salvage_revenue_fields(text)
    if _score_revenue_dict(salvaged) > 0:
        return salvaged

    return {}


def is_revenue_parse_incomplete(parsed: dict, kamis_price: int = 0) -> bool:
    """파싱은 됐지만 화면에 쓸 수 없는 빈 껍데기인지 판별합니다."""
    if not parsed:
        return True

    price_insight = (parsed.get("price_insight") or "").strip()
    revenue_insight = (parsed.get("revenue_insight") or "").strip()
    insights_ok = (
        len(price_insight) >= _INSIGHT_MIN_LEN and len(revenue_insight) >= _INSIGHT_MIN_LEN
    )

    yield_kg = parsed.get("predicted_yield_kg") or 0
    price_kg = parsed.get("predicted_price_per_kg") or 0
    revenue = parsed.get("predicted_revenue") or 0
    effective_price = price_kg or kamis_price
    numbers_ok = bool(yield_kg and effective_price and revenue) or (
        bool(yield_kg and effective_price)
    )

    return not insights_ok and not numbers_ok
