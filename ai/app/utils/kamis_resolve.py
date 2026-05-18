"""
KAMIS 표준 작물명 정규화 (Java KamisCropNameResolver와 동일 규칙).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

# kamis_tool.CROP_CODE_MAP 과 키 집합을 맞춤
from app.agents.tools.kamis_tool import CROP_CODE_MAP


@dataclass(frozen=True)
class ResolveResult:
    input_name: str
    standard_name: Optional[str]
    exact_match: bool
    mapping_note: Optional[str]


def resolve_standard_crop_name(crop_name: str) -> ResolveResult:
    if not crop_name or not crop_name.strip():
        return ResolveResult(crop_name or "", None, False, None)

    trimmed = crop_name.strip()
    if trimmed in CROP_CODE_MAP:
        return ResolveResult(trimmed, trimmed, True, None)

    standards = sorted(CROP_CODE_MAP.keys(), key=len, reverse=True)
    for standard in standards:
        if standard in trimmed:
            note = f"'{trimmed}' → KAMIS 표준 품목 '{standard}' 시세를 사용합니다."
            return ResolveResult(trimmed, standard, False, note)

    return ResolveResult(trimmed, None, False, None)
