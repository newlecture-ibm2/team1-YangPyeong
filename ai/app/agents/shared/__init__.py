"""챗봇 에이전트 공통 유틸 — 도메인 무관 인프라.

각 도메인 에이전트(shop/farm/balance/...)가 공통으로 사용하는 패턴을 모아둔다:
  - action_token : "[ACTION:{...}]" 토큰 직렬화·파싱
  - auth_guard   : JWT 기반 로그인 검사 헬퍼
  - nl_extract   : 자연어에서 가격/재고/한글 명사 추출
  - agent_response: ReAct 에이전트 응답에서 텍스트·액션·툴메시지 추출

새 도메인 에이전트를 추가할 때 이 모듈만 import하면 shop 수준의 안정성을 얻는다.
"""
from app.agents.shared.action_token import (
    action_token,
    split_actions,
)
from app.agents.shared.auth_guard import (
    ensure_logged_in,
    login_required_message,
)
from app.agents.shared.nl_extract import (
    extract_price,
    extract_stock,
    extract_korean_noun,
    extract_product_attrs,
)
from app.agents.shared.agent_response import (
    extract_agent_output,
    AgentOutput,
)

__all__ = [
    "action_token",
    "split_actions",
    "ensure_logged_in",
    "login_required_message",
    "extract_price",
    "extract_stock",
    "extract_korean_noun",
    "extract_product_attrs",
    "extract_agent_output",
    "AgentOutput",
]
