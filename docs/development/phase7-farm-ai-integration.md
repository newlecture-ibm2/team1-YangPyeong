# Phase 7: Farm 재배 이력 데이터 연동 AI 고도화

> 작성일: 2025-05-07 | 관련 체크리스트: [shop-ai-checklist.md](./shop-ai-checklist.md)

## 개요

기존 AI 자동 채우기(autofill)는 **상품명만으로** 카테고리·가격·재고·설명을 추론하는 방식이었습니다.
Phase 7에서는 **로그인한 판매자의 실제 농장 재배 이력**을 함께 전달하여,
AI가 팩트 기반으로 더 정확하고 신뢰도 높은 상품 정보를 생성하도록 고도화했습니다.

```
기존: 상품명 → AI 추론 → 카테고리/가격/설명
개선: 상품명 + 농장 재배이력(원산지, 토양, 수확량, 등급) → AI → 팩트 기반 결과
```

---

## 수정된 파일 목록

| # | 레이어 | 파일 경로 | 변경 내용 |
|:-:|--------|-----------|-----------|
| 1 | AI 모델 | `ai/app/models/product_assist.py` | `FarmContext`, `HarvestSummary` 스키마 추가 |
| 2 | AI 서비스 | `ai/app/services/product_assist_service.py` | 재배 이력 프롬프트 블록 + `autofill_product` 확장 |
| 3 | AI 라우터 | `ai/app/routers/product_assist.py` | `farm_context` 서비스 전달 |
| 4 | BFF | `frontend/app/api/ai/product-assist/autofill/route.ts` | camelCase → snake_case 변환 |
| 5 | Frontend | `frontend/app/(main)/mypage/seller/register/page.tsx` | 농장/재배이력 조회 → farmContext 구성 |

---

## 상세 구현

### 1. AI 서버 — Pydantic 스키마 (`models/product_assist.py`)

재배 이력 데이터를 담는 두 개의 새로운 모델을 추가하고, 기존 `AutofillRequest`를 확장했습니다.

```python
class HarvestSummary(BaseModel):
    """수확 이력 요약."""
    harvest_date: str       # YYYY-MM-DD
    yield_amount: float     # 수확량
    yield_unit: str         # g | kg | ton
    grade: str | None       # A | B | C

class FarmContext(BaseModel):
    """농장 재배 이력 컨텍스트."""
    farm_name: str          # 농장명
    address: str            # 주소 (원산지 추출용)
    soil_type: str | None   # 토양 유형
    organic_matter: float | None  # 유기물 함량
    crop_name: str          # 재배 작물명
    cultivation_area: float | None  # 재배 면적 (㎡)
    harvest_records: list[HarvestSummary]  # 수확 이력

class AutofillRequest(BaseModel):
    product_name: str
    farm_context: FarmContext | None = None  # ← Optional 추가 (하위 호환)
```

> **핵심 설계**: `farm_context`를 `Optional`로 선언하여, 농장이 없는 판매자도 기존과 동일하게 동작합니다.

---

### 2. AI 서비스 — 프롬프트 고도화 (`services/product_assist_service.py`)

`farm_context`가 존재할 때만 프롬프트에 **팩트 블록**을 삽입합니다.

```
## 판매자의 실제 재배 이력 (아래 팩트를 기반으로 작성하세요)
- 농장: 행복농원 (경기도 양평군 양서면 ...)
- 토양: 사질양토, 유기물 3.2%
- 재배 품종: 상추, 면적 500㎡
- 최근 수확 이력:
  - 2025-04-20: 120kg (등급 A)

## 재배 이력 반영 규칙
- 원산지는 위 농장 주소를 기반으로 설명에 명시하세요.
- 수확 이력이 있으면 실제 수확량/등급 정보를 설명에 녹여 신뢰감을 주세요.
- 토양 유기물 함량이 높으면 친환경/건강한 토양 관련 내용을 언급하세요.
```

구현 함수: `_build_farm_context_block(ctx: FarmContext) -> str`

---

### 3. BFF Route Handler (`autofill/route.ts`)

프론트엔드의 **camelCase**를 AI 서버의 **snake_case**로 변환하여 전달합니다.

```typescript
// 프론트엔드에서 받은 farmContext (camelCase)
body.farmContext = { farmName, address, soilType, cropName, ... }

// AI 서버로 보내는 farm_context (snake_case)
aiPayload.farm_context = { farm_name, address, soil_type, crop_name, ... }
```

`farmContext`가 `null`이면 `farm_context` 필드 자체를 생략하여 기존 동작을 유지합니다.

---

### 4. 프론트엔드 — 자동 채우기 흐름 (`register/page.tsx`)

`handleAiAutofill` 함수 내에서 AI 호출 전에 농장 데이터를 자동 조회합니다.

```
① /api/farm          → 내 농장 목록 조회
② /api/farm/{id}     → 농장 상세 (토양 정보 포함)
③ /api/farm/{id}/cultivations → 재배 등록 목록
④ 상품명과 cropName 매칭 (부분 문자열 비교)
⑤ farmContext 구성 → AI autofill API 호출
```

**매칭 로직**: 상품명의 첫 단어와 재배 작물명을 비교하여 가장 관련 있는 재배 이력을 선택합니다.
```typescript
const productKeyword = form.name.trim().split(' ')[0];
const matched = cultivationsData.data.find(
  (c) => form.name.includes(c.cropName) || c.cropName.includes(productKeyword)
);
```

**실패 안전 설계**: 농장 조회가 실패하거나 매칭되는 재배 이력이 없으면 `farmContext = null`로 기존 추론 모드를 유지합니다.

---

### 5. 가이드봇 메시지 분기

재배 이력 사용 여부에 따라 다른 안내 메시지를 표시합니다.

| 상황 | 가이드봇 메시지 |
|------|-----------------|
| 재배 이력 연동 ✅ | 🌱 내 농장의 재배 이력을 바탕으로 AI가 상품 정보를 채워넣었어요! |
| 추론 모드 (기존) | AI가 상품 정보를 채워넣었어요! 🌱 |

---

## 데이터 흐름 다이어그램

```
[판매자: 상품 등록 페이지]
         │
         ├─ ① GET /api/farm (내 농장 목록)
         ├─ ② GET /api/farm/{id} (농장 상세)
         ├─ ③ GET /api/farm/{id}/cultivations (재배 이력)
         │
         ▼
   [farmContext 구성]
         │
         ▼
   [POST /api/ai/product-assist/autofill]
         │  { productName, farmContext }
         ▼
   [BFF Route Handler] ── camelCase → snake_case 변환
         │
         ▼
   [AI 서버: FastAPI]
         │  프롬프트 = 기본 템플릿 + 재배 이력 팩트 블록
         ▼
   [LLM (Gemini)] → JSON 응답
         │
         ▼
   [프론트엔드: 폼 자동 채우기 + 가이드봇 안내]
```

---

## 하위 호환성

- `farm_context`는 `Optional`이므로 **기존 API 스펙을 깨뜨리지 않음**
- 농장 미등록 판매자, 재배 이력 미매칭 시 **자동으로 기존 추론 모드로 폴백**
- 배포 환경의 Docker 설정 변경 불필요
