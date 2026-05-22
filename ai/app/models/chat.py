"""
챗봇 응답 스키마.
Actionable Agent — 단순 텍스트 응답에 더해 프론트엔드가 실행할 액션 목록을 함께 반환합니다.

Action 프로토콜은 docs/development/chatbot-shop-integration-guide.md 3장 참고.
"""
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


ActionType = Literal[
    "NAVIGATE",       # 페이지 이동
    "FILL_FORM",      # 특정 폼 자동 채우기
    "TOAST",          # 토스트 메시지
    "REFRESH",        # 특정 스코프 데이터 재조회
    "CLARIFY",        # 사용자에게 선택지 제시
    "CONFIRM",        # 사용자에게 예/아니오 확인
    "OPEN_MODAL",     # 모달 오픈
    "PRODUCT_LIST",   # 상품 카드 목록 인라인 표시
    "RECOMMEND_CHART", # AI 추천 비교 차트 인라인 표시
]


class ChatProductItem(BaseModel):
    """PRODUCT_LIST 액션에 포함되는 상품 카드 데이터."""
    id: int
    name: str
    price: int
    stock: int
    salesCount: Optional[int] = None
    imageUrl: Optional[str] = None
    categoryName: Optional[str] = None


class RecommendChartItem(BaseModel):
    """RECOMMEND_CHART 액션에 포함되는 레이더 차트용 데이터."""
    cropName: str
    score: float
    soil: float
    price: float
    supply: float


class ChatAction(BaseModel):
    """프론트엔드 디스패처가 실행할 단일 액션."""

    type: ActionType = Field(..., description="액션 타입")

    # NAVIGATE
    url: Optional[str] = Field(None, description="이동할 경로 (NAVIGATE)")
    replace: Optional[bool] = Field(None, description="router.replace 사용 여부")
    delay: Optional[int] = Field(None, description="지연 실행 시간(ms) — 프론트에서 setTimeout 사용")

    # FILL_FORM
    target: Optional[str] = Field(None, description="폼 식별자 (FILL_FORM)")
    payload: Optional[dict[str, Any]] = Field(None, description="폼/모달 페이로드")

    # TOAST
    level: Optional[Literal["success", "info", "error"]] = Field(None, description="토스트 종류")
    message: Optional[str] = Field(None, description="토스트 메시지")

    # REFRESH
    scope: Optional[Literal["cart", "orders", "products", "seller_products", "seller_orders"]] = Field(
        None, description="재조회할 스코프"
    )

    # CLARIFY / CONFIRM
    intent: Optional[str] = Field(None, description="후속 호출에 사용할 의도 식별자")
    question: Optional[str] = Field(None, description="사용자에게 보여줄 질문")
    options: Optional[list[dict[str, Any]]] = Field(
        None, description="CLARIFY 옵션 [{id, label, meta?}]"
    )

    # OPEN_MODAL
    modal: Optional[str] = Field(None, description="모달 식별자")

    # PRODUCT_LIST — 상품 카드 인라인 렌더링
    products: Optional[list[ChatProductItem]] = Field(
        None, description="상품 카드 목록 (PRODUCT_LIST)"
    )

    # RECOMMEND_CHART — 추천 비교 레이더 차트
    recommendChartData: Optional[list[RecommendChartItem]] = Field(
        None, description="레이더 차트에 그릴 작물 점수 목록 (RECOMMEND_CHART)"
    )


class PendingIntent(BaseModel):
    """다중 턴 슬롯 채우기를 위한 보류 의도.

    도구가 필수 인자를 누락한 상태로 호출되면 이 객체를 반환하여
    프론트가 다음 사용자 입력 때 함께 보내도록 한다.
    """

    tool: str = Field(..., description="실행할 도구 이름 (예: 'update_cart_qty')")
    filled: dict[str, Any] = Field(default_factory=dict, description="이미 받은 슬롯 값")
    missing: list[str] = Field(default_factory=list, description="아직 필요한 슬롯 이름")
    prompts: dict[str, str] = Field(
        default_factory=dict,
        description="슬롯별 사용자 질문 문구 (예: {'quantity': '몇 개로 바꿔드릴까요?'})",
    )
    domain: Optional[str] = Field(None, description="도메인 식별자 (예: 'shop'). 슬롯 추출기 선택용")


class ChatResponse(BaseModel):
    """챗봇 응답 - reply(텍스트) + actions(실행 액션 목록) + pending_intent(슬롯 채우기 컨텍스트)."""

    reply: str = Field(..., description="사용자에게 보여줄 자연어 답변")
    actions: list[ChatAction] = Field(default_factory=list, description="프론트가 실행할 액션들")
    pending_intent: Optional[PendingIntent] = Field(
        None, description="슬롯이 부족한 경우 클라이언트가 다음 요청에 동봉할 컨텍스트"
    )
