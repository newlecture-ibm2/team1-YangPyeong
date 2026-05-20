# 다중 턴 슬롯 채우기 (PendingIntent) — 도메인 적용 가이드

이 문서는 새 도메인(Farm, Community, Policy 등)에 다중 턴 컨텍스트를 적용할 때 필요한 절차를 정리합니다.
Shop 도메인이 레퍼런스 구현체이므로 동일한 패턴을 따르면 됩니다.

---

## 동작 개요

```
[1턴] User: "상품 수정해줘"
[1턴]  Bot: "어떤 상품을 바꿔드릴까요?"
            + pending_intent = { tool: "update_cart_qty",
                                  filled: {},
                                  missing: ["product_name", "quantity"],
                                  domain: "shop" }

[2턴] User: "배"
       ─ 서버: pending_intent 존재 → slot_resolver 호출 → product_name="배" 채움
[2턴]  Bot: "몇 개로 바꿔드릴까요?"
            + pending_intent = { ..., filled: {product_name: "배"},
                                       missing: ["quantity"] }

[3턴] User: "3"
       ─ 서버: pending_intent 존재 → quantity=3 채움 → 모두 채워짐
       ─ 서버: tool_dispatcher.invoke("update_cart_qty", product_name="배", quantity=3)
[3턴]  Bot: "'제철 배 5kg' 장바구니 수량을 3개로 변경했어요. ✅"
            + pending_intent = null  ← 종료
```

---

## 신규 도메인 적용 절차 (5단계)

### Step 1. 슬롯 추출기 모듈 작성

도메인 폴더에 `<domain>_slot_extractors.py`를 생성.

```python
# ai/app/agents/tools/farm_slot_extractors.py
from typing import Any, Optional
from app.agents.shared.nl_extract import extract_korean_noun

def extract_crop_name(user_message: str, filled: dict[str, Any]) -> Optional[str]:
    """작물명 슬롯 추출."""
    return extract_korean_noun(user_message)

def extract_area_size(user_message: str, filled: dict[str, Any]) -> Optional[float]:
    """면적 슬롯 추출 (예: '100평')."""
    import re
    m = re.search(r"([\d.]+)\s*평", user_message)
    return float(m.group(1)) if m else None

def register() -> None:
    """슬롯 추출기와 도구를 레지스트리에 등록."""
    from app.agents.shared.slot_resolver import register_slot_extractors
    from app.agents.shared.tool_dispatcher import register_tools
    from app.agents.tools.farm_tools import register_crop, log_harvest  # 예시

    register_slot_extractors("farm", {
        "crop_name": extract_crop_name,
        "area": extract_area_size,
    })
    register_tools({
        "register_crop": register_crop,
        "log_harvest": log_harvest,
    })
```

**중요**: 슬롯 추출기 시그니처는 항상 `(user_message: str, filled: dict[str, Any]) -> Optional[value]`.
이미 채워진 슬롯 정보를 활용해 추출 정확도를 높일 수 있습니다 (예: 작물 종류에 따라 면적 단위 다름).

---

### Step 2. 도구를 PendingIntent 발행 가능하게 수정

기존 도구의 필수 인자를 `Optional[...]`로 바꾸고 누락 시 `pending_intent_token`을 반환.

```python
# ai/app/agents/tools/farm_tools.py
from app.agents.shared.action_token import pending_intent_token as _pending

@tool
async def register_crop(
    crop_name: Optional[str] = None,
    area: Optional[float] = None,
) -> str:
    """농장에 작물 등록.

    필수 인자가 누락되면 PendingIntent를 반환해 다중 턴으로 채울 수 있게 합니다.
    """
    missing = []
    if not crop_name: missing.append("crop_name")
    if area is None: missing.append("area")
    if missing:
        filled = {}
        if crop_name: filled["crop_name"] = crop_name
        if area is not None: filled["area"] = area
        prompts = {
            "crop_name": "어떤 작물을 등록하시겠어요? (예: '상추')",
            "area": "면적이 얼마나 되나요? (예: '100평')",
        }
        return prompts[missing[0]] + " " + _pending({
            "tool": "register_crop",
            "filled": filled,
            "missing": missing,
            "prompts": prompts,
            "domain": "farm",
        })

    # 정상 처리...
```

---

### Step 3. 라우터에서 도메인 등록

`ai/app/routers/chat.py`의 `_register_domain_extractors()`에 한 줄 추가.

```python
def _register_domain_extractors():
    from app.agents.tools import shop_slot_extractors
    shop_slot_extractors.register()

    # 새 도메인 추가
    from app.agents.tools import farm_slot_extractors
    farm_slot_extractors.register()
```

---

### Step 4. 오케스트레이터 키워드 fallback 수정 (선택)

이미 LLM ReAct 에이전트가 도구를 호출하면 자동 동작합니다.
키워드 fallback에서도 PendingIntent를 활용하려면 fallback이 도구를 인자 없이 호출하면 됩니다.

```python
# 예: orchestrator.py 의 farm fallback
if "작물 등록" in user_message:
    result = await register_crop.ainvoke({})  # 인자 없음 → PendingIntent 발행
    return split_actions(result)
```

---

### Step 5. 테스트 시나리오

각 도메인마다 다음 케이스를 테스트:

| 케이스 | 입력 | 기대 동작 |
|---|---|---|
| 슬롯 일괄 입력 | "상추 100평 등록해줘" | 한 번에 도구 실행 |
| 단계별 입력 | "작물 등록해줘" → "상추" → "100평" | 3턴 후 도구 실행 |
| 중간 슬롯만 누락 | "상추 등록해줘" | "면적이 얼마나?" 재질문 |
| 도메인 무관 답변 | (대기 중) "오늘 날씨 어때?" | PendingIntent 폐기 또는 우선 처리 결정 필요 |

---

## 주요 컴포넌트 위치

| 파일 | 역할 |
|---|---|
| `ai/app/models/chat.py` | `PendingIntent` 모델 정의 |
| `ai/app/agents/shared/action_token.py` | `[PENDING_INTENT:...]` 토큰 인코딩/디코딩 |
| `ai/app/agents/shared/slot_resolver.py` | 도메인 무관 슬롯 추출/해소 엔진 |
| `ai/app/agents/shared/tool_dispatcher.py` | 슬롯 완성 시 도구 호출 디스패처 |
| `ai/app/routers/chat.py` | `_handle_pending_intent()` 진입점 |
| `frontend/lib/chat-types.ts` | `PendingIntent` 타입 |
| `frontend/components/common/FarmBot/useFarmBot.ts` | 상태 보관 + 요청 동봉 |
| `frontend/app/api/ai/chat/route.ts` | BFF 패스스루 |

---

## 디자인 결정 사항

### 왜 클라이언트 보관인가?
- 서버 세션 없이 stateless 유지
- Redis/메모리 같은 인프라 의존성 회피
- 사용자가 새 탭/창에서 시작해도 깨끗한 상태

### PendingIntent가 살아있을 때 다른 의도 입력하면?
현재는 **무조건 슬롯 채우기 시도**. 추출 실패 시 다음 슬롯 재질문.
사용자가 명시적으로 취소("아니야", "관둘게")하면 frontend에서 `setPendingIntent(null)` 호출 필요.
TODO: 취소 키워드 자동 감지 추가.

### LLM ReAct vs PendingIntent
LLM도 다중 턴을 어느 정도 처리하지만, 슬롯 추출 일관성이 낮습니다.
PendingIntent는 도메인 추출기를 보장된 방식으로 사용해 안정성↑.
복잡한 자연어 질문은 LLM, 명확한 도구 호출은 PendingIntent로 역할 분담.

---

## 예시: 시나리오별 동작

### Shop — 가격 변경
```
User: "배추 가격 바꿔줘"
 → update_product(product_name="배추") 호출, price 누락
 → PendingIntent(missing=["price"], filled={product_name: "배추"})
Bot: "얼마로 바꿔드릴까요?"
User: "5000"
 → resolve_pending → price=5000 채움
 → tool_dispatcher.invoke("update_product", product_name="배추", price=5000)
Bot: "배추 가격을 5,000원으로 변경했어요."
```

### Farm — 작물 등록 (가이드대로 구현 후)
```
User: "작물 등록할래"
Bot: "어떤 작물을 등록하시겠어요?"
User: "상추"
Bot: "면적이 얼마나 되나요?"
User: "100평"
 → register_crop(crop_name="상추", area=100)
Bot: "상추 100평을 등록했어요."
```
