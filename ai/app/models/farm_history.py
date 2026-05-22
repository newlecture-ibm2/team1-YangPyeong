"""
농장 활동기록 음성 파싱 모델.
ACTIVITIES 리스트는 HistoryModal.tsx의 ACTIVITIES 상수와 정확히 일치해야 합니다.
"""
from typing import get_args
from pydantic import BaseModel, Field
from typing import Literal

ACTIVITY_TYPES = Literal[
    "💧 물주기/관수",
    "🔋 비료 살포",
    "🌿 제초 작업",
    "🐛 병해충 방제",
    "✂️ 가지치기",
    "🍎 수확",
    "🔍 토양 점검",
]

_ALLOWED_ACTIVITIES: set[str] = set(get_args(ACTIVITY_TYPES))


class FarmHistoryParseResponse(BaseModel):
    activities: list[str] = Field(
        default_factory=list,
        description="발화에서 감지된 주요 농작업 목록 (7개 카테고리 내)",
    )
    content: str = Field(
        ...,
        max_length=500,
        description="[YYYY-MM-DD] 로 시작하는 정리된 활동 내용",
    )


def sanitize_farm_history(resp: FarmHistoryParseResponse) -> FarmHistoryParseResponse:
    """LLM이 반환한 값 중 화이트리스트 외 카테고리를 제거합니다."""
    resp.activities = [a for a in resp.activities if a in _ALLOWED_ACTIVITIES]
    resp.content = resp.content[:500]
    return resp
